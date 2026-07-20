import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { checkAdminAuth } from "@/lib/adminAuth";
import { getAsaasConfig, createPixTransfer } from "@/lib/asaas";


// =====================================
// LISTAR SAQUES
// =====================================

export async function GET(req: NextRequest) {

  if (!checkAdminAuth(req)) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    );
  }


  try {

    const withdrawals = await db
      .select({

        id: transactions.id,

        userId: transactions.userId,

        amount: transactions.amount,

        status: transactions.status,

        pixKey: transactions.pixKey,

        pixName: transactions.pixName,

        pixCpf: transactions.pixCpf,

        description: transactions.description,

        createdAt: transactions.createdAt,


        userName: users.name,

        userEmail: users.email,

        userBalance: users.balance,

      })

      .from(transactions)

      .innerJoin(
        users,
        eq(transactions.userId, users.id)
      )

      .where(
        eq(transactions.type, "withdrawal")
      )

      .orderBy(
        desc(transactions.createdAt)
      )

      .limit(200);



    return NextResponse.json({
      withdrawals
    });



  } catch(error) {


    console.error(
      "withdrawals GET error:",
      error
    );


    return NextResponse.json(
      {
        error:"Erro interno"
      },
      {
        status:500
      }
    );

  }

}






// =====================================
// APROVAR / REJEITAR SAQUE
// =====================================

export async function POST(req: NextRequest) {


  if (!checkAdminAuth(req)) {

    return NextResponse.json(
      {
        error:"Não autorizado"
      },
      {
        status:401
      }
    );

  }



  try {


    const {
      transactionId,
      action

    } = await req.json();




    if (

      !transactionId ||

      ![
        "approve",
        "reject"

      ].includes(action)

    ) {


      return NextResponse.json(
        {
          error:"Dados inválidos"
        },
        {
          status:400
        }
      );


    }





    const [tx] = await db
      .select()
      .from(transactions)
      .where(
        eq(
          transactions.id,
          transactionId
        )
      );




    if (!tx) {

      return NextResponse.json(
        {
          error:"Saque não encontrado"
        },
        {
          status:404
        }
      );

    }





    if (tx.status !== "pending") {


      return NextResponse.json(
        {
          error:"Saque já processado"
        },
        {
          status:400
        }
      );

    }





    const [user] = await db
      .select()
      .from(users)
      .where(
        eq(
          users.id,
          tx.userId
        )
      );




    if (!user) {


      return NextResponse.json(
        {
          error:"Usuário não encontrado"
        },
        {
          status:404
        }
      );


    }





    // =====================================
    // REJEITAR
    // =====================================


    if (action === "reject") {


      await db
        .update(users)

        .set({

          balance:
            (
              Number(user.balance) +
              Number(tx.amount)

            ).toString(),



          totalWithdrawn:

            Math.max(

              0,

              Number(user.totalWithdrawn) -

              Number(tx.amount)

            ).toString(),



          updatedAt:
            new Date()

        })

        .where(
          eq(
            users.id,
            user.id
          )
        );






      await db
        .update(transactions)

        .set({

          status:"cancelled",

          updatedAt:
            new Date()

        })

        .where(
          eq(
            transactions.id,
            tx.id
          )
        );




      return NextResponse.json({

        success:true,

        action:"rejected"

      });


    }








    // =====================================
    // APROVAR PIX
    // =====================================


    const {
      apiKey

    } = await getAsaasConfig();





    if (

      apiKey &&

      tx.pixKey

    ) {



      const cpf =

        tx.pixCpf ??

        user.cpf;





      if (!cpf) {


        return NextResponse.json(

          {

            error:
              "CPF obrigatório para PIX"

          },

          {

            status:400

          }

        );


      }







      try {


        await createPixTransfer({

          name:

            tx.pixName ??

            user.name,



          cpf,



          pixKey:

            tx.pixKey,



          amount:

            Number(tx.amount),



          description:

            "Saque Roleta da Sorte"

        });





      } catch(error) {



        console.error(
          "PIX error:",
          error
        );



        return NextResponse.json(

          {

            error:
              "Falha ao enviar PIX"

          },

          {

            status:500

          }

        );


      }


    }








    await db

      .update(transactions)

      .set({

        status:"completed",

        updatedAt:
          new Date()

      })

      .where(

        eq(

          transactions.id,
