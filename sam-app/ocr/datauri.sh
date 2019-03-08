#!/bin/sh
mimetype=$(file -bN --mime-type "$1")
content=$(base64 -in "$1")
echo "data:$mimetype;base64,$content"
