import {MetadataObject} from "@mittwald/kubernetes/types/meta";
import {SMTPServerSpec} from "./smtpserver_spec";


export type SMTPServer = MetadataObject & {
    spec: SMTPServerSpec;
}
