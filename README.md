# 批量发送交易工具

## 预备工作

根据 `.env.example` 创建 `.env`

## 充值账户

充值 amountPerWallet 到账户，账户私钥为 0x1 开始递增。充值前确保环境变量ADMIN_PRIVATE_KEY资金充足
```
npm run deposit <walletCount> <amountPerWallet>
```

## 批量发送

批量发送交易， processId 为该进程标识，同时发送交易账户为该 processId 为私钥开始的 N（hardcode，可自行修改） 个账户。 totalTxNum 为总共发送的交易数量。

> 每个用户发送的交易数量为 totalTxNum/N
```
npm run bulksend <processId> <totalTxNum>
```

## 启动多个进程批量发送

将启动多个进程批量发送，可在 package.json 中自行修改进程数和每个进程发送的数量

```
npm run start
```

## 监控 TPS
```
npm run tps
```

## 需要注意的问题

### 交易池和并发量
并发量应不高于交易池容量上限，否则会导致丢交易。当前设置每个用户每 15笔交易被打包后，再发送下一批。
如下设置 globalslots 为 50000，表示 pending 的交易数最多可容纳 50000。 则当并发账户数为 3000 时，每个用户一个批次交易不要超过 50000/3000=16。

txpool 相关参数。pending 指 nonce 连续的交易，queue 指 nonce 不连续的或即使连续但还没有变成 pending 状态的。
```
--txpool.accountqueue=160
--txpool.accountslots=160
--txpool.globalqueue=50000
--txpool.globalslots=50000
```

查看 txpool 状态的 rpc 有 `txpool_status`，`txpool_content`，`txpool_inspect`。需要运行节点时开启 txpool module。