from pydantic import BaseModel, Field


class Response[Data](BaseModel):
    """Uniform envelope for business JSON responses."""

    code: str = 'OK'
    message: str = '成功'
    data: Data


class ErrorResponse(BaseModel):
    code: str
    message: str
    data: dict[str, str] = Field(default_factory=dict)
