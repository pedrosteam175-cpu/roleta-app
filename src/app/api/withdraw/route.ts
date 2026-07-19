import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, transactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, generateId } from '@/lib/auth';
import { createPayPalPayout } from '@/lib/paypal';


export async function POST(req: NextRequest) {

  try {

    const authUser = await getCurrentUser();


    if (!authUser) {

      return NextResponse.json(
        {
          error: 'Não autenticado'
        },
        {
          status: 401
        }
      );

    }



    const body = await req.json();


    const amount = Number(body.amount);

    const paypalEmail = body.paypalEmail;



    if (!amount || amount <= 0) {

      return NextResponse.json(
        {
          error: 'Valor inválido'
        },
        {
          status: 400
        }
      );

    }



    if (!paypalEmail) {

      return NextResponse.json(
        {
          error: 'E-mail PayPal obrigatório'
        },
        {
          status: 400
        }
      );

    }



    const [user] = await db
      .select()
      .from(users)
      .where(
        eq(
          users.id,
          authUser.id
        )
      );



    if (!user) {

      return NextResponse.json(
        {
          error: 'Usuário não encontrado'
        },
        {
          status: 404
        }
      );

    }



    if (user.balance < amount) {

      return NextResponse.json(
        {
          error: 'Saldo insuficiente'
        },
        {
          status: 400
        }
      );

    }



    /*
      ENVIA PAGAMENTO PAYPAL
    */

    const payout = await createPayPalPayout({

      email: paypalEmail,

      amount,

      note: 'Saque Roleta da Sorte'

    });



    const newBalance = Number(
      (
        user.balance - amount
      ).toFixed(2)
    );



    await db
      .update(users)
      .set({

        balance: newBalance,

        totalWithdrawn:
          user.totalWithdrawn + amount,

        updatedAt: new Date()

      })
      .where(
        eq(
          users.id,
          user.id
        )
      );





    await db
      .insert(transactions)
      .values({

        id: generateId(),

        userId: user.id,

        type: 'withdrawal',

        status: 'completed',

        amount,


        paypalEmail,


        paypalBatchId:
          payout.batchId,


        description:
          `Saque PayPal de R$ ${amount.toFixed(2)}`

      });





    return NextResponse.json({

      success: true,

      newBalance,

      payoutStatus:
        payout.status

    });





  } catch (error: any) {


    console.error(
      'WITHDRAW ERROR:',
      error?.message || error
    );



    return NextResponse.json(

      {
        error:
          error?.message ||
          'Erro ao processar saque'
      },

      {
        status: 500
      }

    );

  }

}
