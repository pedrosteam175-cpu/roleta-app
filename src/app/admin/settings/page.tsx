"use client";


import {
  useEffect,
  useState
} from "react";



export default function PaypalSettingsPage(){


  const [form,setForm] =
    useState({

      clientId:"",
      clientSecret:"",
      mode:"sandbox",
      senderEmail:""

    });



  const [message,setMessage] =
    useState("");



  const [loading,setLoading] =
    useState(false);



  // ==========================
  // CARREGAR CONFIG
  // ==========================

  async function loadConfig(){


    const res =
      await fetch(
        "/api/admin/paypal/settings"
      );


    const data =
      await res.json();



    if(data){

      setForm({

        clientId:
          data.clientId || "",

        clientSecret:
          "",

        mode:
          data.mode || "sandbox",

        senderEmail:
          data.senderEmail || ""

      });

    }


  }



  useEffect(()=>{

    loadConfig();

  },[]);





  function update(
    key:string,
    value:string
  ){

    setForm(
      old=>({

        ...old,

        [key]:
          value

      })
    );

  }





  // ==========================
  // SALVAR
  // ==========================

  async function save(){


    setLoading(true);



    const res =
      await fetch(

        "/api/admin/paypal/settings",

        {

          method:"POST",

          headers:{

            "Content-Type":
              "application/json"

          },


          body:
            JSON.stringify(form)

        }

      );



    const data =
      await res.json();



    setMessage(

      data.message ||
      data.error

    );



    setLoading(false);


  }





  // ==========================
  // TESTAR
  // ==========================

  async function testConnection(){


    setLoading(true);



    const res =
      await fetch(

        "/api/admin/paypal/test",

        {

          method:"POST"

        }

      );



    const data =
      await res.json();



    setMessage(

      data.message ||
      data.error

    );



    setLoading(false);


  }





  return (

<div className="
max-w-xl
mx-auto
p-6
">


<h1 className="
text-2xl
font-bold
mb-6
">

Configuração PayPal Payout

</h1>




<div className="
space-y-4
">


<div>

<label>
Ambiente
</label>


<select

className="
border
w-full
p-2
rounded
"

value={
form.mode
}

onChange={
e=>
update(
"mode",
e.target.value
)
}

>


<option value="sandbox">

Sandbox

</option>


<option value="live">

Produção

</option>


</select>


</div>





<div>

<label>
Client ID
</label>


<input

className="
border
w-full
p-2
rounded
"

placeholder="
PayPal Client ID
"

value={
form.clientId
}

onChange={
e=>
update(
"clientId",
e.target.value
)
}

/>

</div>





<div>

<label>
Client Secret
</label>


<input

type="password"

className="
border
w-full
p-2
rounded
"

placeholder="
Novo Secret PayPal
"

value={
form.clientSecret
}

onChange={
e=>
update(
"clientSecret",
e.target.value
)
}

/>


</div>





<div>

<label>
Email remetente
</label>


<input

className="
border
w-full
p-2
rounded
"

placeholder="
conta@paypal.com
"

value={
form.senderEmail
}

onChange={
e=>
update(
"senderEmail",
e.target.value
)
}

/>


</div>





<button

disabled={
loading
}

onClick={
save
}

className="
bg-blue-600
text-white
px-5
py-2
rounded
mr-3
"

>


Salvar


</button>





<button

disabled={
loading
}

onClick={
testConnection
}

className="
bg-green-600
text-white
px-5
py-2
rounded
"

>


Testar conexão


</button>



<p className="
mt-5
font-medium
">

{message}

</p>


</div>


</div>

  );


      }
