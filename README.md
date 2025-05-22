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

