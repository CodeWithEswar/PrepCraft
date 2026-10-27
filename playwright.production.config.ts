import { defineConfig } from "@playwright/test"
import base from "./playwright.config"
/** Run after build:webpack, with next start -p 3031 already listening. */
export default defineConfig({...base,use:{...base.use,baseURL:"http://localhost:3031"},webServer:undefined})
