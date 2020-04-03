import builtins from "builtin-modules";

import acornClassFields from "acorn-class-fields";

import consts from "rollup-plugin-consts";
import cleanup from "rollup-plugin-cleanup";
import native from "rollup-plugin-native";

import executable from "rollup-plugin-executable";
import commonjs from "@rollup/plugin-commonjs";

import resolve from "@rollup/plugin-node-resolve";
import { readFileSync } from "fs";