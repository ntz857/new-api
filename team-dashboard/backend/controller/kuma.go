package controller

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	kumaBase = "https://kuma.apiniclaw.com"
	kumaSlug = "meione"
)

type KumaHeartbeat struct {
	Status int    `json:"status"`
	Time   string `json:"time"`
	Ping   int    `json:"ping"`
}

type KumaMonitor struct {
	ID         int             `json:"id"`
	Name       string          `json:"name"`
	Status     int             `json:"status"`
	Uptime     float64         `json:"uptime"`
	Ping       int             `json:"ping"`
	Heartbeats []KumaHeartbeat `json:"heartbeats"`
}

type KumaGroup struct {
	Name     string        `json:"name"`
	Monitors []KumaMonitor `json:"monitors"`
}

func GetKumaStatus(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	client := &http.Client{Timeout: 10 * time.Second}

	fetch := func(url string, dest interface{}) error {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			return err
		}
		resp, err := client.Do(req)
		if err != nil {
			return err
		}
		defer resp.Body.Close()
		return json.NewDecoder(resp.Body).Decode(dest)
	}

	var statusData struct {
		PublicGroupList []struct {
			Name        string `json:"name"`
			MonitorList []struct {
				ID   int    `json:"id"`
				Name string `json:"name"`
			} `json:"monitorList"`
		} `json:"publicGroupList"`
	}
	var heartbeatData struct {
		HeartbeatList map[string][]struct {
			Status int    `json:"status"`
			Time   string `json:"time"`
			Ping   int    `json:"ping"`
		} `json:"heartbeatList"`
		UptimeList map[string]float64 `json:"uptimeList"`
	}

	if err := fetch(kumaBase+"/api/status-page/"+kumaSlug, &statusData); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"success": false, "message": "kuma status fetch failed"})
		return
	}
	if err := fetch(kumaBase+"/api/status-page/heartbeat/"+kumaSlug, &heartbeatData); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"success": false, "message": "kuma heartbeat fetch failed"})
		return
	}

	var groups []KumaGroup
	for _, pg := range statusData.PublicGroupList {
		group := KumaGroup{Name: pg.Name}
		for _, m := range pg.MonitorList {
			mid := strconv.Itoa(m.ID)
			monitor := KumaMonitor{ID: m.ID, Name: m.Name}

			if hbs, ok := heartbeatData.HeartbeatList[mid]; ok && len(hbs) > 0 {
				// API 返回最旧在前，最新在后
				latest := hbs[len(hbs)-1]
				monitor.Status = latest.Status
				monitor.Ping = latest.Ping
				// 直接按原顺序传（左旧右新），最多取后50条
				if len(hbs) > 50 {
					hbs = hbs[len(hbs)-50:]
				}
				monitor.Heartbeats = make([]KumaHeartbeat, len(hbs))
				for i, h := range hbs {
					monitor.Heartbeats[i] = KumaHeartbeat{
						Status: h.Status,
						Time:   h.Time,
						Ping:   h.Ping,
					}
				}
			}
			if u, ok := heartbeatData.UptimeList[mid+"_24"]; ok {
				monitor.Uptime = u
			}
			group.Monitors = append(group.Monitors, monitor)
		}
		groups = append(groups, group)
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": groups})
}
