# 基座用 ghcr 上 uv + python 一体的镜像：本机构建因此不依赖 Docker Hub
# （auth.docker.io 在该网络下直接 connection refused）。
# 要用官方镜像时得先解决 Docker Hub 可达，并加回 COPY --from 引入 uv。
ARG BASE=ghcr.io/astral-sh/uv:python3.13-bookworm-slim

FROM ${BASE} AS builder

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv

WORKDIR /src

# 只拷清单不拷源码：依赖层可被缓存，改代码不会重装依赖。
# 无 [build-system] 的 virtual project 不安装项目自身，所以一次 uv sync 就够。
# --no-dev 必须显式给：uv sync 默认装 dependency-groups.dev，会把 pytest/ruff/pyright 打进生产镜像。
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --locked --no-dev

COPY app ./app

FROM ${BASE}

ENV PYTHONUNBUFFERED=1 \
    PATH=/opt/venv/bin:$PATH

RUN useradd --create-home api
WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --chown=api:api app ./app
COPY --chown=api:api alembic.ini ./
COPY --chown=api:api migrations ./migrations

USER api
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
