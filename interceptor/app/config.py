from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Required — no default. Missing env var must fail at boot, not silently
    # connect to whatever DB the developer happened to set last.
    database_url: str

    # Public/non-sensitive defaults are fine.
    anthropic_upstream_url: str = "https://api.anthropic.com"
    default_org_id: str = "demo"
    host: str = "0.0.0.0"
    port: int = 8080

    # Anthropic API key dedicada al NL judge (Layer 3). Si no se setea, la
    # capa NL queda deshabilitada y el proxy se comporta como v0.1 (regex +
    # passthrough). Tener una key separada del cliente nos permite usar
    # Haiku sin depender de subscriptions, betas u OAuth scopes ajenos.
    anthropic_judge_api_key: str | None = None


settings = Settings()
