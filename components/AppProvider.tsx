'use client';

import { TurnkeyProvider } from "@turnkey/sdk-react";
import localFont from "next/font/local";

const geistSans = localFont({
    src: "../app/fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});
const geistMono = localFont({
    src: "../app/fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

const AppProvider = ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    const turnkeyConfig = {
        apiBaseUrl: process.env.NEXT_PUBLIC_TURNKEY_API_BASE_URL!,
        defaultOrganizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
        rpId: process.env.NEXT_PUBLIC_RPID!,
        serverSignUrl: process.env.NEXT_PUBLIC_SERVER_SIGN_URL!,
        iframeUrl: process.env.NEXT_PUBLIC_IFRAME_URL ?? "https://auth.turnkey.com", // not necessary for this example
    };


    return (
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
            <TurnkeyProvider config={turnkeyConfig}>
                {children}
            </TurnkeyProvider>
        </body>
    );
}

export default AppProvider;