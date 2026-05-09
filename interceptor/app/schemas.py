"""Pydantic shapes for the Anthropic Messages API subset we accept.

Strict only on the fields we read; everything else is forwarded as-is via
the raw dict so we don't silently drop new Anthropic fields when the SDK
ships them.
"""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class TextBlock(BaseModel):
    model_config = ConfigDict(extra="allow")
    type: Literal["text"]
    text: str


class Message(BaseModel):
    model_config = ConfigDict(extra="allow")
    role: Literal["user", "assistant"]
    content: str | list[dict[str, Any]]


class MessagesRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    model: str
    max_tokens: int = Field(default=1024)
    system: str | list[dict[str, Any]] | None = None
    messages: list[Message]
