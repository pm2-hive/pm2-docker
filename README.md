# Monitor your docker containers with PM2

Requires Docker version 1.5.x or higher as the stats API was released as part of the Docker Remote API version 1.17

# How to use it ?

```
RUN pm2 install pm2-docker
```

When starting make sure you expose the local docker socket via -v /var/run/docker.sock:/var/run/docker.sock

```
$ docker run -p 81:3000  -v `pwd`/example_app:/app -v /var/run/docker.sock:/var/run/docker.sock keymetrics/pm2-docker-alpine
```

# LICENSE

TBD
