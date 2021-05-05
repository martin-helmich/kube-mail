/* Do not change, this code is generated from Golang structs */

import {authType} from "./enums"

export interface SMTPServerSpec {
    server: string;
    port?: number;
    tls?: boolean;
    authType?: authType;
}