export function SendMessage(from, to, amount = "100000000000000000", symbol = "hbc") {
    return {
        type: "hbtcchain/transfer/MsgSend",
        value: {
            amount: [
                { amount, denom: symbol }
            ],
            from_address: from,
            to_address: to
        }
    };
}

export function CrossKeyGenMessage(from, to, symbol, order_id) {
    return {
        type: "hbtcchain/keygen/MsgKeyGen",
        value: {
            from,
            order_id,
            symbol,
            to,
        },
    };
}
export function CrossDepositMessage(from, to, amount = "100000000", symbol = "eth", gas_fee = "10000", order_id) {
    return {
        type: "hbtcchain/transfer/MsgDeposit",
        value: {
            from_cu: from,
            to_multi_sign_address: to,
            symbol,
            amount,
            gas_fee,
            order_id
        }
    };
}
export function CrossWithdrawalMessage(from, to, amount = "100000000", symbol = "eth", gas_fee = "10000", order_id) {
    return {
        type: "hbtcchain/transfer/MsgWithdrawal",
        value: {
            from_cu: from,
            to_multi_sign_address: to,
            symbol,
            amount,
            gas_fee,
            order_id
        }
    };
}