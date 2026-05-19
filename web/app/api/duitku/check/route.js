import crypto from "node:crypto";
import sql from "@/app/api/utils/sql";

import {
  getSessionUser,
  notifyMember,
  logActivity,
} from "@/app/api/utils/helpers";

// ========================================
// CHECK PAYMENT STATUS
// ========================================
export async function POST(request) {
  try {
    // ========================================
    // AUTH
    // ========================================
    const user = await getSessionUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ========================================
    // BODY
    // ========================================
    const body = await request.json();

    const merchantOrderId = body.merchantOrderId;

    if (!merchantOrderId) {
      return Response.json(
        {
          error: "merchantOrderId required",
        },
        { status: 400 }
      );
    }

    // ========================================
    // FIND TOPUP
    // ========================================
    const topupResult = await sql`
      SELECT *
      FROM topups
      WHERE
        duitku_merchant_order_id = ${merchantOrderId}
        AND user_id = ${user.id}
      LIMIT 1
    `;

    const topup = topupResult[0];

    if (!topup) {
      return Response.json({ error: "Topup not found" }, { status: 404 });
    }

    // ========================================
    // ALREADY APPROVED
    // ========================================
    if (topup.status === "approved") {
      return Response.json({
        success: true,
        status: "approved",
        topup,
      });
    }

    // ========================================
    // GET SETTINGS
    // ========================================
    const settings = await sql`
      SELECT *
      FROM duitku_settings
      WHERE id = 1
      LIMIT 1
    `;

    const cfg = settings[0];

    if (!cfg) {
      return Response.json({ error: "Duitku not configured" }, { status: 400 });
    }
    console.log("DUITKU HOST:", apiHost);
    console.log("DUITKU PAYLOAD:", payload);
    // ========================================
    // API HOST
    // ========================================
    const apiHost =
      cfg.mode === "production"
        ? "https://passport.duitku.com"
        : "https://sandbox-new.duitku.com";
    console.log("DUITKU STATUS:", duitkuRequest.status);
    const rawText = await duitkuRequest.text();

    console.log("DUITKU RAW RESPONSE:", rawText);

    const dRes = JSON.parse(rawText);
    // ========================================
    // SIGNATURE
    // MD5(merchantCode + merchantOrderId + apiKey)
    // ========================================
    const signature = crypto
      .createHash("md5")
      .update(`${cfg.merchant_code}${merchantOrderId}${cfg.api_key}`)
      .digest("hex");

    // ========================================
    // REQUEST STATUS
    // ========================================
    let duitkuResponse = {};

    try {
      const response = await fetch(
        `${apiHost}/webapi/api/merchant/transactionStatus`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            merchantCode: cfg.merchant_code,
            merchantOrderId,
            signature,
          }),
        }
      );

      duitkuResponse = await response.json();

      console.log("DUITKU STATUS:", duitkuResponse);
    } catch (err) {
      console.error("DUITKU STATUS ERROR:", err);

      return Response.json(
        {
          error: "Gagal terhubung ke Duitku",
        },
        { status: 502 }
      );
    }

    // ========================================
    // SUCCESS PAYMENT
    // ========================================
    if (String(duitkuResponse.statusCode) === "00") {
      // ========================================
      // RECHECK TOPUP
      // Anti double approve
      // ========================================
      const latestTopupResult = await sql`
          SELECT *
          FROM topups
          WHERE id = ${topup.id}
          LIMIT 1
        `;

      const latestTopup = latestTopupResult[0];

      if (latestTopup.status === "approved") {
        return Response.json({
          success: true,
          status: "approved",
          topup: latestTopup,
        });
      }

      // ========================================
      // GET PROFILE
      // ========================================
      const profileResult = await sql`
          SELECT *
          FROM user_profiles
          WHERE user_id = ${topup.user_id}
          LIMIT 1
        `;

      const profile = profileResult[0];

      if (!profile) {
        return Response.json(
          {
            error: "User profile not found",
          },
          { status: 404 }
        );
      }

      const amount = Number(topup.amount || 0);

      const balanceBefore = Number(profile.balance || 0);

      const balanceAfter = balanceBefore + amount;

      // ========================================
      // CHECK TRANSACTION EXIST
      // ========================================
      const existingTx = await sql`
          SELECT id
          FROM balance_transactions
          WHERE
            reference_type = 'topup'
            AND reference_id = ${topup.id}
            AND transaction_type = 'topup'
          LIMIT 1
        `;

      // ========================================
      // TRANSACTION
      // ========================================
      await sql.transaction([
        // UPDATE TOPUP
        sql`
          UPDATE topups
          SET
            status = 'approved',
            approved_at = NOW(),
            duitku_reference = ${duitkuResponse.reference || null},
            duitku_response = ${JSON.stringify(duitkuResponse)},
            updated_at = NOW()
          WHERE
            id = ${topup.id}
            AND status != 'approved'
        `,

        // UPDATE BALANCE
        ...(existingTx.length === 0
          ? [
              sql`
                UPDATE user_profiles
                SET
                  balance = balance + ${amount},
                  updated_at = NOW()
                WHERE user_id = ${topup.user_id}
              `,
            ]
          : []),

        // INSERT HISTORY
        ...(existingTx.length === 0
          ? [
              sql`
                INSERT INTO balance_transactions (
                  user_id,
                  transaction_type,
                  amount,
                  balance_before,
                  balance_after,
                  reference_type,
                  reference_id,
                  description,
                  created_at
                )
                VALUES (
                  ${topup.user_id},
                  'topup',
                  ${amount},
                  ${balanceBefore},
                  ${balanceAfter},
                  'topup',
                  ${topup.id},
                  ${`Topup ${topup.topup_number} via Duitku`},
                  NOW()
                )
              `,
            ]
          : []),
      ]);

      // ========================================
      // LOG
      // ========================================
      await logActivity(
        topup.user_id,
        "topup_duitku_success",
        `Topup ${topup.topup_number} approved via status check`
      );

      // ========================================
      // NOTIFICATION
      // ========================================
      await notifyMember(
        topup.user_id,
        "Topup Berhasil",
        `Topup ${topup.topup_number} sebesar Rp ${amount.toLocaleString(
          "id-ID"
        )} berhasil. Saldo sudah masuk.`,
        "success",
        "/dashboard/saldo",
        true,
        {
          amount: amount.toLocaleString("id-ID"),
          order: topup.topup_number,
        },
        "template_topup_success"
      );

      // ========================================
      // GET UPDATED TOPUP
      // ========================================
      const updatedResult = await sql`
          SELECT *
          FROM topups
          WHERE id = ${topup.id}
          LIMIT 1
        `;

      const updatedTopup = updatedResult[0];

      return Response.json({
        success: true,
        status: "approved",
        topup: updatedTopup,
        duitku: duitkuResponse,
      });
    }

    // ========================================
    // PENDING / FAILED
    // ========================================
    return Response.json({
      success: true,
      status: topup.status || "pending",
      duitku: duitkuResponse,
    });
  } catch (e) {
    console.error("CHECK STATUS ERROR:", e);

    return Response.json(
      {
        error: "Internal Server Error",
        message: e.message,
      },
      { status: 500 }
    );
  }
}


