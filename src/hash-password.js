#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { hashPassword } from "./lib/server/password.js";

const argv = yargs(hideBin(process.argv))
    .option("password", {
        type: "string",
        demandOption: true,
        description: "Password to hash (argon2id)",
    })
    .parse();

console.log(await hashPassword(argv.password));
