import { TurnkeyApiTypes, type TurnkeyClient } from "@turnkey/http";
import { Turnkey } from "@turnkey/sdk-browser";

export type Attestation = TurnkeyApiTypes["v1Attestation"];
export type OauthProviderParams = TurnkeyApiTypes["v1OauthProviderParams"]
export type Email = `${string}@${string}.${string}`;