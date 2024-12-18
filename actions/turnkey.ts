import { turnkeyConfig } from "@/config/turnkey"
import { Attestation, Email, OauthProviderParams } from "@/types/turnkey"
import {
    ApiKeyStamper,
    DEFAULT_ETHEREUM_ACCOUNTS,
    TurnkeyServerClient,
} from "@turnkey/sdk-server"
import { WalletType } from "@turnkey/wallet-stamper"
import { decode, JwtPayload } from "jsonwebtoken"

const stamper = new ApiKeyStamper({
    apiPublicKey: process.env.NEXT_PUBLIC_TURNKEY_API_PUBLIC_KEY!,
    apiPrivateKey: process.env.NEXT_PUBLIC_TURNKEY_API_PRIVATE_KEY!,
})

const client = new TurnkeyServerClient({
    apiBaseUrl: turnkeyConfig.apiBaseUrl,
    organizationId: turnkeyConfig.organizationId,
    stamper,
})

type EmailParam = { email: Email }
type PublicKeyParam = { publicKey: string }
type UsernameParam = { username: string }
type OidcTokenParam = { oidcToken: string }

function decodeJwt(credential: string): JwtPayload | null {
    const decoded = decode(credential)

    if (decoded && typeof decoded === "object" && "email" in decoded) {
        return decoded as JwtPayload
    }

    return null
}

export function getSubOrgId(param: EmailParam): Promise<string>
export function getSubOrgId(param: PublicKeyParam): Promise<string>
export function getSubOrgId(param: UsernameParam): Promise<string>
export function getSubOrgId(param: OidcTokenParam): Promise<string>

export async function getSubOrgId(
    param: EmailParam | PublicKeyParam | UsernameParam | OidcTokenParam
): Promise<string> {
    let filterType: string
    let filterValue: string

    if ("email" in param) {
        filterType = "EMAIL"
        filterValue = param.email
    } else if ("publicKey" in param) {
        filterType = "PUBLIC_KEY"
        filterValue = param.publicKey
    } else if ("username" in param) {
        filterType = "USERNAME"
        filterValue = param.username
    } else if ("oidcToken" in param) {
        filterType = "OIDC_TOKEN"
        filterValue = param.oidcToken
    } else {
        throw new Error("Invalid parameter")
    }

    const { organizationIds } = await client.getSubOrgIds({
        organizationId: turnkeyConfig.organizationId,
        filterType,
        filterValue,
    })

    return organizationIds[0]
}

export const getSubOrgIdByEmail = async (email: Email) => {
    return getSubOrgId({ email })
}

export const getSubOrgIdByPublicKey = async (publicKey: string) => {
    return getSubOrgId({ publicKey })
}

export const getSubOrgIdByUsername = async (username: string) => {
    return getSubOrgId({ username })
}

export const createUserSubOrg = async ({
    email,
    passkey,
    oauth,
    wallet,
}: {
    email?: Email
    passkey?: {
        challenge: string
        attestation: Attestation
    }
    oauth?: OauthProviderParams
    wallet?: {
        publicKey: string
        type: WalletType
    }
}) => {
    const authenticators = passkey
        ? [
            {
                authenticatorName: "Passkey",
                challenge: passkey.challenge,
                attestation: passkey.attestation,
            },
        ]
        : []

    const oauthProviders = oauth
        ? [
            {
                providerName: oauth.providerName,
                oidcToken: oauth.oidcToken,
            },
        ]
        : []

    const apiKeys = wallet
        ? [
            {
                apiKeyName: "Wallet Auth - Embedded Wallet",
                publicKey: wallet.publicKey,
                curveType:
                    wallet.type === WalletType.Ethereum
                        ? ("API_KEY_CURVE_SECP256K1" as const)
                        : ("API_KEY_CURVE_ED25519" as const),
            },
        ]
        : []

    let userEmail = email
    // If the user is logging in with a Google Auth credential, use the email from the decoded OIDC token (credential
    // Otherwise, use the email from the email parameter
    if (oauth) {
        const decoded = decodeJwt(oauth.oidcToken)
        if (decoded?.email) {
            userEmail = decoded.email
        }
    }
    const subOrganizationName = `Sub Org - ${email}`
    const userName = email ? email.split("@")?.[0] || email : ""

    const subOrg = await client.createSubOrganization({
        organizationId: turnkeyConfig.organizationId,
        subOrganizationName,
        rootUsers: [
            {
                userName,
                userEmail,
                oauthProviders,
                authenticators,
                apiKeys,
            },
        ],
        rootQuorumThreshold: 1,
        wallet: {
            walletName: "Default Wallet",
            accounts: DEFAULT_ETHEREUM_ACCOUNTS,
        },
    })
    const userId = subOrg.rootUserIds?.[0]
    if (!userId) {
        throw new Error("No root user ID found")
    }
    const { user } = await client.getUser({
        organizationId: subOrg.subOrganizationId,
        userId,
    })

    return { subOrg, user }
}