# SuperBaseNames
> Making BaseNames Accessible and Hassle Free :)))

## Demo

Recording:

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/u5y1M4LTjp0/0.jpg)](https://www.youtube.com/watch?v=u5y1M4LTjp0)

Application: [https://superbasenames.vercel.app](superbasenames.vercel.app)

## About the Project

ENS has done a wonderful job by expanding to Base. And with the 100+ L2s we live with, you may forget where your ETH is lying to buy that lucrative Basename. 

Trying to get funds in the right place is a HUUUGEE task. And did we forget bootstrapping gas on Base?

Well. That's what SuperBaseNames solves!

----

SuperBaseNames provides you with the comfort to buy basenames with any tokens on any chain! 

We provide an interface where users can forget about bridging their ETH and just focus on which Basenames they want to HODL.

We use the Cross-chain Intents Framework built by Router Protocol to enable the entire flow. Users can bridge their funds and buy the domain in a single interaction! We can thus enable chain abstracted experiences for the users.

A brief walkthrough of how SuperBaseNames work:
1. Users find their desired BaseName, and select the asset they want to pay.
2. The quote API creates an optimal quote/route for swapping user's paid asset and ETH on Base.
3. This same quote includes the calldata to buy the ENS for the user.
4. Whenever the final transaction occurs on Base, the ENS is bought for the user. 
5. Excess ETH funds remaining from buying the ENS are returned to the user.
6. Using the excess ETH, users can perform a second step to set the ENS as their primary name.

## Challenges

(Back pain.)

Figuring out how the basenames contracts work took a while without the docs for L2 specific actions. We used Tenderly and the ENS Github repo to figure out how we can buy names from a contract adapter.

Another huge blocker was to figure out reverse quotes for the bridging requests. The support to request for quotes with destination token amount is extremely sparse. We've created a workaround for that during this hack which needs a little bit of extra slippage. Though this extra amount is always returned to the user as ETH on Base. And this step also helps to bootstrap some gas for the second step of setting the name as a primary name for the address.

Setting reverse configuration for some different address is not possible. And this really took a bunch of our time, trying to hack around the contracts and testing the deployments. As a final solution, now we require users to do another transaction to set a BaseName as their primary one.
