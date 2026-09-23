from fastapi import Request, HTTPException, status
from clerk_backend_api import AuthenticateRequestOptions, authenticate_request
from app.config import settings


def get_current_user(request: Request):
    req_state = authenticate_request(
        request,
        AuthenticateRequestOptions(
            secret_key=settings.clerk_secret_key,
            authorized_parties=["http://localhost:5173"],
        ),
    )
    if not req_state.is_signed_in:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized user"
        )

    user_id = req_state.payload.get("sub")

    return user_id
