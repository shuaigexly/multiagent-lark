"""飞书上下文读取 API"""
import asyncio
import time

from fastapi import APIRouter, Depends, Query

from app.core.auth import require_api_key
from app.feishu.reader import (
    list_calendar_events,
    list_chat_messages,
    list_chats,
    list_drive_files,
    list_tasks,
    list_wiki_nodes,
    list_wiki_spaces,
    read_doc_content,
)

router = APIRouter(
    prefix="/api/v1/feishu",
    tags=["feishu-context"],
    dependencies=[Depends(require_api_key)],
)


def _default_calendar_range() -> tuple[str, str]:
    start = int(time.time())
    end = start + 7 * 24 * 60 * 60
    return str(start), str(end)


@router.get("/drive")
async def get_drive_files(page_size: int = Query(20, ge=1, le=200)):
    data = await list_drive_files(page_size=page_size)
    return {"data": data, "total": len(data)}


@router.get("/wiki/spaces")
async def get_wiki_spaces(page_size: int = Query(20, ge=1, le=200)):
    data = await list_wiki_spaces(page_size=page_size)
    return {"data": data, "total": len(data)}


@router.get("/wiki/nodes/{space_id}")
async def get_wiki_nodes(space_id: str, page_size: int = Query(50, ge=1, le=200)):
    data = await list_wiki_nodes(space_id=space_id, page_size=page_size)
    return {"data": data, "total": len(data)}


@router.get("/chats")
async def get_chats(page_size: int = Query(20, ge=1, le=200)):
    data = await list_chats(page_size=page_size)
    return {"data": data, "total": len(data)}


@router.get("/chats/{chat_id}/messages")
async def get_chat_messages(chat_id: str, page_size: int = Query(20, ge=1, le=200)):
    data = await list_chat_messages(chat_id=chat_id, page_size=page_size)
    return {"data": data, "total": len(data)}


@router.get("/calendar")
async def get_calendar_events(
    start: str | None = Query(None),
    end: str | None = Query(None),
    page_size: int = Query(50, ge=1, le=200),
):
    default_start, default_end = _default_calendar_range()
    data = await list_calendar_events(
        start_time=start or default_start,
        end_time=end or default_end,
        page_size=page_size,
    )
    return {"data": data, "total": len(data)}


@router.get("/tasks")
async def get_tasks(page_size: int = Query(50, ge=1, le=200)):
    data = await list_tasks(page_size=page_size)
    return {"data": data, "total": len(data)}


@router.get("/doc/{token}/content")
async def get_doc_content(token: str):
    content = await read_doc_content(token)
    return {"content": content}


@router.get("/context")
async def get_feishu_context():
    start, end = _default_calendar_range()
    drive, calendar, tasks = await asyncio.gather(
        list_drive_files(page_size=10),
        list_calendar_events(start_time=start, end_time=end, page_size=50),
        list_tasks(page_size=20),
    )
    pending_tasks = [item for item in tasks if not item.get("completed")][:20]
    return {
        "drive": drive,
        "calendar": calendar,
        "tasks": pending_tasks,
    }
