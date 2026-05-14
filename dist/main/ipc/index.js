"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIPC = setupIPC;
const file_handlers_1 = require("./file-handlers");
const dialog_handlers_1 = require("./dialog-handlers");
const test_handlers_1 = require("./test-handlers");
const system_handlers_1 = require("./system-handlers");
function setupIPC() {
    (0, file_handlers_1.registerFileHandlers)();
    (0, dialog_handlers_1.registerDialogHandlers)();
    (0, test_handlers_1.registerTestHandlers)();
    (0, system_handlers_1.registerSystemHandlers)();
}
