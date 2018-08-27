import * as addrs from "email-addresses";
import ParsedMailbox = emailAddresses.ParsedMailbox;

export const anonymizeEmailAddress = (email: string): string => {
    const parsed = addrs.parseOneAddress(email) as ParsedMailbox;
    return '****@' + parsed.domain;
};