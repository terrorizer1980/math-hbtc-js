
<template>
  <v-app dark>
    <v-main class="grey lighten-3">
      <v-container>
        <v-card color="primary">
          <v-card-title class="text-center justify-center py-2">
            <h5 class="white--text">
              {{ idenity ? idenity.account : "Open in MathWallet" }}
            </h5>
            <v-spacer />
            <template v-if="idenity">
              <v-btn @click="logout" small>logout</v-btn>
            </template>
            <template v-else>
              <v-btn @click="login" small>login</v-btn>
            </template>
          </v-card-title>

          <v-tabs v-model="selectedChainIndex" color="primary" grow>
            <v-tab v-for="chain in chains" :key="chain.name">
              {{ chain.name }}
            </v-tab>
          </v-tabs>

          <v-tabs-items v-model="selectedChainIndex">
            <v-tab-item v-for="chain in chains" :key="chain.symbol">
              <h4 v-if="!idenity" class="py-2 px-6">Login first</h4>
              <v-card flat v-else>
                <template v-if="chain.external_address || chain.native">
                  <v-card-title v-if="chain.external_address">{{
                    chain.external_address
                  }}</v-card-title>

                  <v-list flat two-line>
                    <v-list-item-group color="primary">
                      <template
                        v-for="(asset, index) in getChainAssets(
                          selectedChainIndex
                        )"
                      >
                        <v-list-item :key="asset.symbol">
                          <v-list-item-content>
                            <v-list-item-title
                              v-text="asset.symbol"
                            ></v-list-item-title>
                            <v-list-item-subtitle
                              v-text="asset.amount"
                            ></v-list-item-subtitle>
                          </v-list-item-content>
                          <v-list-item-action>
                            <template v-if="chain.native"
                              ><v-btn
                                text
                                small
                                color="primary"
                                @click="sendAction(asset)"
                                >Send</v-btn
                              ></template
                            ><template v-else
                              ><v-btn
                                text
                                small
                                color="primary"
                                @click="crossDepositAction"
                                >Deposit</v-btn
                              ><v-btn
                                text
                                small
                                color="success"
                                @click="crossWithdrawalAction"
                                >Withdrawal</v-btn
                              ></template
                            >
                          </v-list-item-action>
                        </v-list-item>
                        <v-divider
                          v-if="
                            index <
                            getChainAssets(selectedChainIndex).length - 1
                          "
                          :key="index"
                        ></v-divider
                      ></template>
                    </v-list-item-group>
                  </v-list>
                </template>
                <template v-else>
                  <v-card-actions>
                    <v-btn small @click="crossKeyGenAction">Generate</v-btn>
                  </v-card-actions>
                </template>
              </v-card>
            </v-tab-item>
          </v-tabs-items>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { parseAmount } from "./utils/Format";
import {
  SendMessage,
  CrossKeyGenMessage,
  CrossDepositMessage,
  CrossWithdrawalMessage,
} from "./utils/Message";
export default {
  data() {
    return {
      chains: [
        {
          name: "HBC",
          native: true,
          external_address: "",
          assets: [
            { symbol: "HBC", amount: "0" },
            { symbol: "KIWI", amount: "0" },
          ],
        },
        {
          name: "BTC",
          native: false,
          external_address: "",
          assets: [{ symbol: "BTC", amount: "0" }],
        },
        {
          name: "ETH",
          native: false,
          assets: [
            { symbol: "ETH", amount: "0" },
            {
              symbol: "EBTC",
              amount: "0",
            },
            { symbol: "HT", amount: "0" },
            {
              symbol: "ETRX",
              amount: "0",
            },
            {
              symbol: "LINK",
              amount: "0",
            },
          ],
        },
        {
          name: "TRX",
          native: false,
          external_address: "",
          assets: [{ symbol: "TRX", amount: "0" }],
        },
      ],
      selectedChainIndex: 0,
      network: {
        blockchain: "hbtc",
        chainId: "hbtc-testnet",
      },
      provider: null,
      idenity: null,
    };
  },
  mounted() {
    setInterval(() => {
      if (this.idenity) {
        this.setChainAssetsFromRPC(this.idenity.account);
      }
    }, 5000);
  },
  methods: {
    randomOrderId() {
      var orderId = "";
      for (let index = 0; index < 4; index++) {
        orderId = orderId + Math.floor(Math.random() * (9999 - 1000)) + 1000;
      }
      return orderId;
    },
    getChainAssets(index) {
      return this.idenity ? this.chains[index].assets : [];
    },
    setChainAssetsFromRPC(account) {
      this.rpc_getAccountInfo(account)
        .then((chainAccount) => {
          // {"amount":"0.19","frozen_amount":"","is_native":false,"symbol":"","external_address":""}
          const rpcAssets = chainAccount.assets;
          this.chains.forEach((chain) => {
            const mainAsset = rpcAssets.find(
              (a) =>
                a.symbol.toLowerCase() == chain.name.toLowerCase() &&
                chain.native == a.is_native
            );
            chain.external_address = mainAsset
              ? mainAsset.external_address
              : "";
            chain.assets.forEach((asset) => {
              rpcAssets.forEach((rpcAsset) => {
                if (
                  asset.symbol.toLowerCase() == rpcAsset.symbol.toLowerCase() &&
                  chain.native == rpcAsset.is_native
                ) {
                  asset.amount = rpcAsset.amount;
                }
              });
            });
          });
        })
        .catch((e) => {});
    },
    async rpc_getAccountInfo(account) {
      const response = await this.provider.get(`/api/v1/cus/${account}`);
      return response.result;
    },
    login() {
      window.mathExtension.getIdentity(this.network).then((idenity) => {
        this.idenity = idenity;
        this.provider = window.mathExtension.httpProvider("https://juswap.io");
        this.setChainAssetsFromRPC(this.idenity.account);
      });
    },
    logout() {
      window.mathExtension.forgetIdentity().then(() => {
        this.idenity = null;
      });
    },
    sendAction(asset) {
      this.requestSignature(
        SendMessage(
          this.idenity.account,
          "HBCWbBg9EeN7ssSjhaU961e7DtYJQmANhms6",
          "10000000000000000000",
          asset.symbol.toLowerCase()
        )
      );
    },
    crossKeyGenAction() {
      this.requestSignature(
        CrossKeyGenMessage(
          this.idenity.account,
          this.idenity.account,
          this.chains[this.selectedChainIndex].name.toLowerCase(),
          this.randomOrderId()
        )
      );
    },
    crossWithdrawalAction() {
      this.requestSignature(
        CrossWithdrawalMessage(
          this.idenity.account,
          "0xE0c21C6E53637a7FD02eceB8a458c16FF117948F",
          "100000000000000",
          "10000",
          this.randomOrderId()
        )
      );
    },
    crossDepositAction() {
      alert("Coming online soon");
    },
    requestSignature(msg) {
      this.rpc_getAccountInfo(this.idenity.account)
        .then((chainAccount) => {
          console.log(chainAccount);
          const transaction = {
            chain_id: this.network.chainId,
            fee: {
              amount: [
                {
                  amount: "2000000000000000000",
                  denom: "hbc",
                },
              ],
              gas: "2000000",
            },
            memo: "",
            msgs: [msg],
            sequence: chainAccount.sequence,
          };
          // 请求插件签名
          window.mathExtension
            .requestSignature(transaction)
            .then((signature) => {
              // Broadcast
              const broadcatTx = {
                msg: transaction.msgs,
                fee: transaction.fee,
                memo: transaction.memo,
                signatures: [signature],
              };
              const opts = {
                data: { tx: broadcatTx, mode: "block" },
                headers: {
                  "Content-Type": "text/plain",
                },
              };
              this.provider
                .post("/api/v1/txs", null, opts)
                .then((response2) => {
                  alert("Success");
                })
                .catch((err2) => {
                  alert(err2.response.data.error);
                });
            })
            .catch((e) => {
              console.log(e);
            });
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
};
</script>