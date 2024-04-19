// worker.js（worker线程）
import { _____keys, _____keysPerms, updateNumberRounding } from "./workerJsUnits";

self.addEventListener("error", err => {
    console.log(err.message);
});
self.addEventListener("message", ({ data }) => {
    const message = data.message;
    switch (data.type) {
        case "PERM":
            break;
        case "CELLDATA":
            const _message = JSON.parse(message);
            _message.forEach((celldata) => {
                if (_____keysPerms.some((i) => i === "check")) {
                    const checkKeys = _____keys.check;
                    if (checkKeys.slice(0, -1).some((i) => i === celldata.v.v)) {
                        celldata.v.v = checkKeys.at(-1);
                    }
                }
                if (celldata.v) {
                    updateNumberRounding(celldata.r, celldata.c, celldata.v, celldata.v);
                }
            });
            self.postMessage({
                type: "CELLDATARESULT",
                message: _message,
            });
            break;
    }
});