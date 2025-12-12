"use client";

import Link from "next/link";
import {
  Coins,
  Zap,
  Shield,
  Wallet,
  ArrowRight,
  CheckCircle,
  Globe,
  Lock,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Web3Provider } from "@/lib/web3-provider";
import { GLUSDWalletConnect } from "@/components/glusd/GLUSDWalletConnect";
import { GLUSDStats } from "@/components/glusd/GLUSDStats";
import { GLUSDMintCard } from "@/components/glusd/GLUSDMintCard";
import { GLUSDRedeemCard } from "@/components/glusd/GLUSDRedeemCard";
import { useAccount } from "wagmi";

function GLUSDContent() {
  const { address, isConnected } = useAccount();

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-200">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-white">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-900/20 bg-blue-950/5 px-4 py-2 text-sm text-blue-950">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Galaksio USD Token</span>
            </div>

            {/* Main Heading */}
            <h1 className="mt-8 text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl">
              Fuel Your Cloud
              <span className="block bg-gradient-to-r from-blue-950 via-blue-900 to-slate-800 bg-clip-text text-transparent">
                with GLUSD
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 text-lg leading-8 text-zinc-700 max-w-2xl mx-auto">
              A yield-bearing stablecoin backed by USDC. Earn passive yield as revenue from 
              Galaksio&apos;s x402 services increases the exchange rate. Non-rebasing design means 
              your token count stays the same while each GLUSD becomes worth more USDC.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-wrap justify-center items-center gap-4">
              <Button
                size="lg"
                className="bg-blue-950 hover:bg-blue-900 text-white shadow-lg"
              >
                <Wallet className="h-5 w-5 mr-2" />
                Get GLUSD
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-zinc-300"
              >
                Learn More
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-blue-950">USDC</div>
                <div className="text-sm text-zinc-600 mt-1">Backed 1:1</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-950">0.5%</div>
                <div className="text-sm text-zinc-600 mt-1">Mint/Redeem Fee</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-950">25%</div>
                <div className="text-sm text-zinc-600 mt-1">Revenue to Vault</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-950">APR</div>
                <div className="text-sm text-zinc-600 mt-1">Yield Accruing</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
              Why GLUSD?
            </h2>
            <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">
              A yield-bearing stablecoin that grows in value as Galaksio&apos;s x402 services generate revenue
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-zinc-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-950/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-950" />
                </div>
                <CardTitle>Yield-Bearing</CardTitle>
                <CardDescription>
                  Earn passive yield as x402 service revenue increases the USDC/GLUSD exchange rate. 25% of all platform revenue goes to GLUSD holders.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="border-zinc-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-950/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-blue-950" />
                </div>
                <CardTitle>USDC Backed</CardTitle>
                <CardDescription>
                  Every GLUSD is backed by USDC in the vault. Non-rebasing design means value accrues through exchange rate, not token count.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="border-zinc-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-950/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-950" />
                </div>
                <CardTitle>Instant Liquidity</CardTitle>
                <CardDescription>
                  Mint GLUSD by depositing USDC or redeem back to USDC anytime. 0.5% fee on mint/redeem covers operational costs.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className="border-zinc-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-950/10 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-blue-950" />
                </div>
                <CardTitle>Transparent APR/APY</CardTitle>
                <CardDescription>
                  Track 7-day and 30-day APR/APY on-chain. Snapshots every hour provide accurate yield calculations over 90-day periods.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card className="border-zinc-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-950/10 flex items-center justify-center mb-4">
                  <Coins className="h-6 w-6 text-blue-950" />
                </div>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>
                  RevenueSplitter contracts automatically funnel 25% of x402 compute and storage fees into the GLUSD vault using Chainlink Automation.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card className="border-zinc-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-950/10 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-blue-950" />
                </div>
                <CardTitle>Ecosystem Utility</CardTitle>
                <CardDescription>
                  Use GLUSD to pay for Galaksio services while earning yield on your balance. Your infrastructure payment token that appreciates.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-zinc-50 border-y border-zinc-200">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">
              GLUSD uses an exchange rate mechanism where value accrues as revenue flows into the vault
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-blue-950 flex items-center justify-center text-white text-2xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-3">
                  Mint GLUSD
                </h3>
                <p className="text-zinc-600">
                  Deposit USDC to mint GLUSD at current exchange rate. 0.5% fee, then USDC enters vault and you receive GLUSD tokens.
                </p>
                <div className="mt-4 p-3 bg-zinc-50 rounded-lg text-xs font-mono text-zinc-700">
                  <div>1000 USDC deposit</div>
                  <div className="text-zinc-500">- 5 USDC fee (0.5%)</div>
                  <div className="text-blue-950 font-semibold">= 947.62 GLUSD</div>
                  <div className="text-zinc-400 text-[10px]">@ 1.05 rate</div>
                </div>
              </div>
              {/* Connector Line */}
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-zinc-200"></div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-blue-950 flex items-center justify-center text-white text-2xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-3">
                  Earn Yield
                </h3>
                <p className="text-zinc-600">
                  As x402 services generate revenue, 25% flows to GLUSD vault via RevenueSplitters, increasing the exchange rate.
                </p>
                <div className="mt-4 p-3 bg-zinc-50 rounded-lg text-xs font-mono text-zinc-700">
                  <div className="text-zinc-500">Exchange Rate</div>
                  <div>1.00 → 1.05 → 1.10</div>
                  <div className="text-blue-950 font-semibold mt-2">Your GLUSD = More USDC</div>
                </div>
              </div>
              {/* Connector Line */}
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-zinc-200"></div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-blue-950 flex items-center justify-center text-white text-2xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-3">
                  Redeem Anytime
                </h3>
                <p className="text-zinc-600">
                  Burn GLUSD to get USDC back at current exchange rate. 0.5% fee deducted, remaining USDC transferred to you.
                </p>
                <div className="mt-4 p-3 bg-zinc-50 rounded-lg text-xs font-mono text-zinc-700">
                  <div>100 GLUSD redeem</div>
                  <div className="text-zinc-500">105 USDC gross</div>
                  <div className="text-zinc-500">- 0.525 fee (0.5%)</div>
                  <div className="text-blue-950 font-semibold">= 104.475 USDC</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
              Revenue Flow & Yield Generation
            </h2>
            <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">
              How x402 service revenue becomes GLUSD holder yield through RevenueSplitters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Use Case 1 */}
            <Card className="border-zinc-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-950" />
                  Compute Revenue Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">Users pay USDC for code execution on Akash</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">Compute RevenueSplitter receives payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">25% deposited to GLUSD vault, 75% to operations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">Exchange rate increases, benefiting all holders</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Use Case 2 */}
            <Card className="border-zinc-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-blue-950" />
                  Storage Revenue Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">Users pay USDC for permanent Arweave storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">Storage RevenueSplitter receives payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">25% deposited to GLUSD vault via depositFees()</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">Chainlink Automation triggers distributions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Use Case 3 */}
            <Card className="border-zinc-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-950" />
                  APR/APY Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">Snapshots taken hourly (min 30 sec interval)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">Circular buffer stores 2160 snapshots (90 days)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">Calculate 7-day and 30-day APR on-chain</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">APY accounts for compound interest effects</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Use Case 4 */}
            <Card className="border-zinc-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-950" />
                  Smart Contract Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">Non-rebasing design prevents balance manipulation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">Pausable for emergency situations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">Role-based access control for admin functions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">Full USDC backing auditable on-chain</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Trading Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Mint & Redeem GLUSD
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Connect your wallet to start earning yield with GLUSD
            </p>
          </div>

          {/* Wallet Connection */}
          <div className="flex justify-center mb-12">
            <GLUSDWalletConnect />
          </div>

          {/* Stats Dashboard */}
          <div className="mb-12">
            <GLUSDStats />
          </div>

          {/* Mint/Redeem Tabs */}
          <div className="max-w-2xl mx-auto">
            <Tabs defaultValue="mint" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-slate-700">
                <TabsTrigger 
                  value="mint" 
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  Mint GLUSD
                </TabsTrigger>
                <TabsTrigger 
                  value="redeem"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
                >
                  Redeem GLUSD
                </TabsTrigger>
              </TabsList>
              <TabsContent value="mint">
                <GLUSDMintCard userAddress={isConnected ? address : undefined} />
              </TabsContent>
              <TabsContent value="redeem">
                <GLUSDRedeemCard userAddress={isConnected ? address : undefined} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            <Card className="border-zinc-200">
              <CardHeader>
                <CardTitle className="text-lg">What is GLUSD?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600">
                  GLUSD (Galaksio USD) is a yield-bearing stablecoin backed by USDC. It&apos;s non-rebasing, 
                  meaning value accrues through exchange rate appreciation rather than balance increases. 
                  As Galaksio&apos;s x402 services generate revenue, 25% flows into the GLUSD vault, 
                  increasing how much USDC each GLUSD token is worth.
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200">
              <CardHeader>
                <CardTitle className="text-lg">How do I mint and redeem GLUSD?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600 mb-3">
                  <strong>Minting:</strong> Deposit USDC to receive GLUSD at the current exchange rate. 
                  A 0.5% fee is deducted, and the remaining USDC (99.5%) goes into the vault. 
                  You receive GLUSD = (amountAfterFee × 1e6) / exchangeRate.
                </p>
                <p className="text-zinc-600">
                  <strong>Redeeming:</strong> Burn GLUSD to get USDC back. The contract calculates 
                  USDC value = (glusdAmount × exchangeRate) / 1e6, deducts 0.5% fee, and transfers 
                  the remaining 99.5% USDC to you.
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200">
              <CardHeader>
                <CardTitle className="text-lg">How is yield generated?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600">
                  Revenue from x402 services (compute and storage) flows through RevenueSplitter contracts. 
                  These automatically distribute 25% to the GLUSD vault and 75% to operational costs using 
                  Chainlink Automation. When USDC is deposited via depositFees(), the exchange rate increases, 
                  making each GLUSD worth more USDC. This creates passive yield for all holders.
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200">
              <CardHeader>
                <CardTitle className="text-lg">How are APR and APY calculated?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600 mb-2">
                  GLUSD tracks exchange rate snapshots in a circular buffer (2160 snapshots, ~90 days). 
                  Snapshots are taken hourly when revenue is deposited.
                </p>
                <p className="text-zinc-600 mb-2">
                  <strong>APR (Annual Percentage Rate):</strong> Simple interest annualized = 
                  (rateIncrease / oldRate) × (SECONDS_PER_YEAR / timeElapsed) × 100
                </p>
                <p className="text-zinc-600">
                  <strong>APY (Annual Percentage Yield):</strong> Compound interest annualized ≈ 
                  (currentRate/oldRate - 1) × (SECONDS_PER_YEAR / timeElapsed) × 100
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200">
              <CardHeader>
                <CardTitle className="text-lg">What are the fees?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600">
                  Both minting and redeeming have a 0.5% fee. These fees go to the feeRecipient 
                  address (configurable by admin) to cover operational costs and protocol maintenance. 
                  The fees are separate from the vault&apos;s USDC backing and don&apos;t affect the 
                  exchange rate.
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200">
              <CardHeader>
                <CardTitle className="text-lg">Is GLUSD safe?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600">
                  GLUSD is fully backed by USDC held in the vault contract. The non-rebasing design 
                  prevents balance manipulation attacks. The contract includes pausable functionality 
                  for emergencies, role-based access control for sensitive functions, and all USDC 
                  backing is auditable on-chain via vaultStatus(). Exchange rate and yield are 
                  transparently calculated from on-chain snapshots.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function GLUSDPage() {
  return (
    <Web3Provider>
      <GLUSDContent />
    </Web3Provider>
  );
}
