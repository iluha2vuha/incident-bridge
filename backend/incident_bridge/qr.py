from __future__ import annotations

from io import BytesIO

import qrcode
import qrcode.image.svg


def qr_svg(data: str) -> str:
    image = qrcode.make(
        data,
        image_factory=qrcode.image.svg.SvgPathImage,
        box_size=10,
        border=4,
    )
    buffer = BytesIO()
    image.save(buffer)
    return buffer.getvalue().decode("utf-8")
