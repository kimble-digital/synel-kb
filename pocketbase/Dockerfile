# PocketBase for Fly.io (Synel Knowledge Base backend)
FROM alpine:3.20

ARG PB_VERSION=0.39.5
RUN apk add --no-cache unzip ca-certificates

ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/ && rm /tmp/pb.zip

# Server-side hooks (e.g. trigger the Vercel rebuild on publish)
COPY ./pb_hooks /pb/pb_hooks

EXPOSE 8080
# pb_data is a mounted volume (see fly.toml) so your data + uploads persist
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=/pb/pb_data"]
