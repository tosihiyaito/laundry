# -*- coding: utf-8 -*-
"""index.html の APP_VERSION を今の日時に書き換える（更新を出す前に実行する）。

端末は起動時に公開中のファイルの APP_VERSION を見て、自分と違えば
自動で新しい版に入れ替わる。だから「更新したのに古い画面のまま」を
防ぐには、中身を変えたら必ず版も変える必要がある。
手で書き換えるのは忘れやすいので、このスクリプトが自動で行う。

index.html に変更が無いときは何もしない（意味のない版上げをしないため）。
"""
import io
import os
import re
import subprocess
import sys
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
TARGET = os.path.join(HERE, "index.html")


def changed() -> bool:
    """index.html が前回のコミットから変わっているか"""
    try:
        out = subprocess.run(
            ["git", "diff", "--name-only", "HEAD", "--", "index.html"],
            cwd=HERE, capture_output=True, text=True,
        )
        return bool(out.stdout.strip())
    except Exception:
        return True   # git が使えないときは、念のため版を上げる


def main() -> int:
    if not os.path.exists(TARGET):
        print("index.html not found")
        return 1
    if not changed():
        print("index.html unchanged - version kept")
        return 0

    src = io.open(TARGET, encoding="utf-8", newline="").read()
    if not re.search(r'const APP_VERSION = "[^"]*";', src):
        print("APP_VERSION not found in index.html")
        return 1

    version = datetime.now().strftime("%Y-%m-%d-%H%M")
    src = re.sub(r'const APP_VERSION = "[^"]*";',
                 'const APP_VERSION = "%s";' % version, src, count=1)
    io.open(TARGET, "w", encoding="utf-8", newline="").write(src)
    print("version stamped: %s" % version)
    return 0


if __name__ == "__main__":
    sys.exit(main())
