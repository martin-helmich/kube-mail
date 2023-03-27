/* Do not change, this code is generated from Golang structs */

import {authType, connect} from "./enums"

export interface SMTPServerSpec {
    server: string;
    port?: number;
    tls?: boolean;
    connect?: connect;
    authType?: authType;
}