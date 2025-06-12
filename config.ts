import dotenv from 'dotenv';

const output = dotenv.config();
if (output.error) {
    console.error("error", output.error)
}

export const config = {
    L2_RPC_URL: process.env.L2_RPC_URL,
    // BATCH_SEND_NUM: process.env.BATCH_SEND_NUM,
    ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY,
    IS_RECEIVER_BY_PK: process.env.IS_RECEIVER_BY_PK == "true",
}
