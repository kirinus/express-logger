"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const danger_1 = require("danger");
const modifiedMD = danger_1.danger.git.modified_files.join('- ');
danger_1.message('Changed Files in this PR: \n - ' + modifiedMD);
//# sourceMappingURL=dangerfile.js.map