'use client';

import { createUserSubOrg, getSubOrgIdByEmail } from "@/actions/turnkey";
import { Email } from "@/types/turnkey";
import { Turnkey } from "@turnkey/sdk-browser";
import { useTurnkey } from "@turnkey/sdk-react";
import { useState } from "react";

const Page = () => {
    const { turnkey, authIframeClient, passkeyClient, walletClient, client } = useTurnkey();

    const [email, setEmail] = useState('');
    const [subOrg, setSubOrg] = useState<any>();
    const [user, setUser] = useState<any>();

    const loginWithPasskey = async (email?: string) => {
        console.log(email);
        
        try {
            const subOrgId = await getSubOrgIdByEmail(email as Email)
        
            if (subOrgId?.length) {
                console.log('subOrgId', subOrgId);
                const loginResponse = await passkeyClient?.login();
                if (loginResponse?.organizationId) {
                    console.log('Login success');
                    console.log('loginResponse', loginResponse);
                }
            } else {
                // User either does not have an account with a sub organization
                // or does not have a passkey
                // Create a new passkey for the user
                const { encodedChallenge, attestation } =
                    (await passkeyClient?.createUserPasskey({
                        publicKey: {
                            user: {
                                name: email,
                                displayName: email,
                            },
                        },
                    })) || {}

                // Create a new sub organization for the user
                if (encodedChallenge && attestation) {
                    const { subOrg, user } = await createUserSubOrg({
                        email: email as Email,
                        passkey: {
                            challenge: encodedChallenge,
                            attestation,
                        },
                    })

                    if (subOrg && user) {
                        setSubOrg(subOrg);
                        setUser(user);
                    }
                }
            }
        } catch (error: any) {
            console.error(error);
        }
    }

    return (
        <div className="container mx-auto py-10 flex flex-col gap-4 items-center">
            <div className="text-xl font-bold">Turnkey Demo</div>
            <button onClick={()=>{
                console.log('passkeyClient', passkeyClient);
                console.log('subOrg', subOrg);
                console.log('user', user);
            }}>log</button>
            <hr />
            <input type="email" value={email} onChange={v => setEmail(v.target.value)} />
            <button onClick={() => loginWithPasskey(email)}>Sign in with Passkey</button>
        </div>
    );
}

export default Page;