import { NextApiRequest, NextApiResponse } from "next";

type ProxyResponse = {
  glsStatus: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProxyResponse>
) {
  const { query } = req;
  const { pn } = query;

  if (pn) {
    if (typeof pn === "string") {
      fetch(`https://www.gls-one.de/api/trace/${pn}/history?lang=de`, {
        method: "GET",
      })
        .then(async (response) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const data = await response.json();

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const desc = data[data.length - 1]["description"] as string;
          console.log(desc, "a");

          return res.status(200).json({ glsStatus: desc });
        })
        .catch(() => {
          // if (err.status === 401) {
          //   // errors = { username: "Wrong Creds" };
          // }
          console.log("Fuck mate");
        });
    }
  }
}
