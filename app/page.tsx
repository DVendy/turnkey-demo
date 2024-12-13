'use client';

import useCreateSub from "@/hooks/useCreateSub";
import { DEFAULT_ETHEREUM_ACCOUNTS, Turnkey, TurnkeyPasskeyClient } from "@turnkey/sdk-browser";
import { useEffect, useState } from "react";

const Page = () => {

    const [passkeyClient, setPasskeyClient] = useState<TurnkeyPasskeyClient>();
    const [walletId, setWalletId] = useState<string>();
    const [accountAddress, setAccountAddress] = useState<string>();

    const initPassketClient = () => {
        if (process.env.NEXT_PUBLIC_ORGANIZATION_ID === undefined) {
            throw 'Organization ID not defined';
        }

        const turnkey = new Turnkey({
            apiBaseUrl: "https://api.turnkey.com",
            defaultOrganizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID,
        });

        const passkeyClient = turnkey.passkeyClient();
        setPasskeyClient(passkeyClient);
    }

    const createAccount = async () => {
        try {
            if (passkeyClient === undefined) {
                throw 'Passkey client undefined';
            }

            const credential = await passkeyClient.createUserPasskey({
                publicKey: {
                    user: {
                        name: 'Escher Account',
                        displayName: 'Cloud Strife'
                    }
                }
            });
            console.log('credential', credential);

            const subOrganizationConfig = {
                subOrganizationName: 'escher',
                rootUsers: [{
                    userName: 'escher-user',
                    apiKeys: [],
                    authenticators: [
                        {
                            authenticatorName: "PassKey",
                            challenge: credential.encodedChallenge,
                            attestation: credential.attestation
                        }
                    ],
                    oauthProviders: []
                }],
                rootQuorumThreshold: 1,
                wallet: {
                    walletName: "Default wallet",
                    accounts: DEFAULT_ETHEREUM_ACCOUNTS
                }
            }

            const subOrganizationResponse = await passkeyClient.createSubOrganization(
                subOrganizationConfig,
            );
            console.log('subOrganizationResponse', subOrganizationResponse);

            const walletResponse = await passkeyClient.createWallet({
                walletName: "Wallet Created with User Authentication",
                accounts: DEFAULT_ETHEREUM_ACCOUNTS,
            });

            setWalletId(walletResponse.walletId);
            setAccountAddress(walletResponse.addresses[0]);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        initPassketClient();
    }, [])

    return (
        <div className="container mx-auto py-10 flex flex-col gap-4 items-center">
            <div className="text-xl font-bold">Turnkey Demo</div>
            {accountAddress ?
                <div>Address : {accountAddress}</div>
                :
                <button
                    onClick={createAccount}
                    className="rounded border border-sky-500 hover:bg-sky-100 text-sky-500 font-bold text-sm px-4 py-2"
                >
                    Create account
                </button>
            }
        </div>
    );
}

export default Page;