#!/bin/bash

IMAGE_NAME="new-api"
TAG="1.0.0"

docker build \
  --build-arg BUN_CONFIG_REGISTRY=https://registry.npmjs.org \
  --build-arg GOPROXY=https://goproxy.cn,direct \
  -t "${IMAGE_NAME}:${TAG}" .

echo "Built: ${IMAGE_NAME}:apiniclaw-${TAG}"
