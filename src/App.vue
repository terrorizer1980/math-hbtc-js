<template>
  <v-app>
    <v-content>
      <v-container fluid>
        <v-card class="mx-auto">
          <v-card-title
            >{{ idenity ? idenity.account : "Open MathWallet" }} <br />
          </v-card-title>
          <v-card-actions>
            <v-btn class="primary" @click="login" v-if="!idenity">Log in</v-btn>
            <v-btn class="warning" @click="logout" v-else>Log out</v-btn>
          </v-card-actions>
        </v-card>

        <v-card light class="mt-2" v-if="assets.length > 0">
          <v-card-title>Assets</v-card-title>
          <v-card-text>
            <v-list class="mx-auto">
              <template v-for="asset in assets">
                <v-list-item :key="asset.symbol">
                  <v-list-item-content>
                    <v-list-item-title
                      v-text="asset.symbol"
                    ></v-list-item-title>
                    <v-list-item-subtitle
                      v-text="asset.amount"
                    ></v-list-item-subtitle> </v-list-item-content
                ></v-list-item>
              </template>
            </v-list>
          </v-card-text>
        </v-card>
        <v-card light class="mt-2" v-if="idenity">
          <v-card-title>Transfer</v-card-title>
          <v-card-subtitle>
            <v-text-field
              label="Recipient"
              v-model="recipient"
              placeholder="band19r4ta37cnd6yxcpu9qsyf37qhgjmhgsde46vnw"
              filled
            ></v-text-field>
            <v-text-field
              label="Amount"
              v-model="amount"
              placeholder="0.1"
              filled
            ></v-text-field>
          </v-card-subtitle>
          <v-card-actions>
            <v-btn class="success" @click="requestSignature">Send</v-btn>
          </v-card-actions>
        </v-card>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import { parseAmount } from "./utils/Format";
export default {
  name: "App",
  data() {
    return {
      network: {
        blockchain: "hbtc",
        chainId: "hbtc-testnet",
      },
      provider: null,
      idenity: null,
      assets: [],
      recipient: "HBChDYdRX6LkyrmBABdgFthQsQw4h7kVWtLS",
      amount: "",
    };
  },
  methods: {
    login() {
      window.mathExtension.getIdentity(this.network).then((idenity) => {
        this.idenity = idenity;
        this.provider = window.mathExtension.httpProvider("https://juswap.io");
        this.getAccountInfo()
          .then((chainAccount) => {
            this.assets = chainAccount.assets;
          })
          .catch((e) => {});
      });
    },
    logout() {
      window.mathExtension.forgetIdentity().then(() => {
        this.idenity = null;
        this.assets = [];
      });
    },
    async getAccountInfo() {
      const response = await this.provider.get(
        `/api/v1/cus/${this.idenity.account}`
      );
      return response.result;
    },
    requestSignature() {
      this.getAccountInfo()
        .then((chainAccount) => {
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
            msgs: [
              {
                type: "hbtcchain/transfer/MsgSend",
                value: {
                  amount: [
                    {
                      amount: parseAmount(this.amount, 18),
                      denom: "hbc",
                    },
                  ],
                  from_address: this.idenity.account,
                  to_address: this.recipient,
                },
              },
            ],
            sequence: chainAccount.sequence,
          };
          // 请求插件签名
          window.mathExtension
            .requestSignature(transaction)
            .then((signature) => {
              console.log(signature);
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
                  console.log(response2);
                })
                .catch((err2) => {
                  console.log(err2);
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

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
