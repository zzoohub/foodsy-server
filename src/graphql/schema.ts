import { buildSchema } from "graphql";
import { readFileSync } from "fs";
import { join } from "path";

// schema.graphql 파일에서 스키마 읽어오기
const schemaPath = join(__dirname, "schema.graphql");
const typeDefs = readFileSync(schemaPath, "utf8");

export const schema = buildSchema(typeDefs);
