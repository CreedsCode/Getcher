"use client";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/24/solid";
import { Listbox, Transition } from "@headlessui/react";
import { Field, Form, Formik } from "formik";
import { type NextPage } from "next";
import Head from "next/head";
import { useEffect, useState, Fragment } from "react";
import Papa from "papaparse";
import { log } from "console";

interface HeaderSelectionItem {
  id: number;
  name: string;
  preview: string;
  unavailable: boolean;
}
interface Values {
  username: string;
  password: string;
}

const UploadState = {
  init: "Upload a file",
  select: "Select the column",
  processing: "Processing",
  done: "Download results",
} as const;

type UploadState = (typeof UploadState)[keyof typeof UploadState];
const Home: NextPage = () => {
  const [proccessingCount, setProccessingCount] = useState(0);
  const [packageNumbers, setPackageNumbers] = useState<Array<string> | null>(
    null
  );
  const [headerSelected, setHeaderSelected] = useState(false);
  const [selectedColumn, setSelectedColumn] =
    useState<HeaderSelectionItem | null>(null);
  const [headers, setHeaders] = useState<Array<HeaderSelectionItem> | null>(
    null
  );
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>(UploadState.init);

  const columnSelected = () => {
    setHeaderSelected(true);
    console.log("Selected Header, ", selectedColumn);
  };

  useEffect(() => {
    // Wait till the state is computed
    console.log(headers, "kign");
    if (headers) {
      console.log("New Headers");
      setUploadState(UploadState.select);
    }
  }, [headers]);

  useEffect(() => {
    if (!file) return;
    let i = 1;
    let newHeaders:
      | ((
          prevState: HeaderSelectionItem[] | null
        ) => HeaderSelectionItem[] | null)
      | {
          id: number;
          name: any;
          preview: any; // or maybe [key],
          unavailable: boolean;
        }[]
      | null = null;
    const data: Promise<any>[] = [];
    Papa.parse(file, {
      worker: true,
      header: true,
      step: function (row) {
        const fields = row.meta.fields;
        const rowData = row.data as string[];
        if (!headers && i == 2) {
          // @ts-ignore:next-line
          newHeaders = Object.keys(row.meta.fields).map((key, index) => ({
            id: index + 1,
            // @ts-ignore:next-line
            name: fields[key] as string,
            // @ts-ignore:next-line
            preview: rowData[fields[key] as string] as string,
            unavailable: false,
          }));
          console.log("hereAASDASd", newHeaders);
        }
        if (headerSelected && i >= 2) {
          if (uploadState != "Processing") {
            setUploadState(UploadState.processing);
            console.log("Lets process");
          }

          // @ts-ignore:next-line
          console.log("now: ", rowData[selectedColumn]);

          // @ts-ignore:next-line
          let fetch_id = rowData[selectedColumn] as string;
          fetch_id = fetch_id.slice(0, 11);
          if (fetch_id !== "") {
            fetch(`/api/proxy/${fetch_id}`, {
              method: "GET",
            })
              .then(async (response) => {
                const idk = await response.json();
                data.push(idk);
                setProccessingCount(proccessingCount + 1);
                console.log("fetched", fetch_id, idk);
              })
              .catch(() => {
                console.log("pls fix, todo shaming");
              });
          }
        }
        console.log(row.data, i, "log");

        i++;
      },
      complete: function () {
        console.log("done!");
        setHeaders(newHeaders);
        console.log(data, "done");
      },
    });
  }, [file, headerSelected]);

  const handleSubmit = (values: Values) => {
    const apiSecret = JSON.stringify(
      Buffer.from(values.username + ":" + values.password).toString("base64")
    );
    localStorage.setItem("secret", apiSecret);
  };

  const handleFileChange = (e: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const target = e.target as HTMLInputElement;

    if (!target.files) {
      return;
    }

    if (!target.files.length) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const inputFile = target.files[0];
    if (inputFile) {
      const fileExtension =
        inputFile.name.split(".")[inputFile?.name.split(".").length - 1];
      console.log(fileExtension);

      if (fileExtension !== "csv") {
        return;
      }
      console.log("Setting input");

      setFile(inputFile);
    }
  };

  return (
    <>
      <Head>
        <title>Getcher</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-[hsl(204,100%,70%)] sm:text-[5rem]">
            G<span className="text-[hsl(280,100%,70%)]">etcher</span>
          </h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <div>
              <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20">
                <div>
                  <h3 className="inline-block text-2xl font-bold">Upload</h3>
                  <p className="float-right inline-block italic">
                    {uploadState}
                  </p>
                </div>

                {
                  {
                    "Upload a file": (
                      <div className="relative border border-dashed">
                        <input
                          type="file"
                          name="file"
                          onChange={handleFileChange}
                          className="relative z-50 block h-full w-full cursor-pointer p-20 opacity-0"
                        />
                        <div className="absolute top-0 right-0 left-0 m-auto p-10 text-center">
                          <h4>
                            Drop file to upload <br />
                            or
                          </h4>
                          <p className="">Select File</p>
                        </div>
                      </div>
                    ),
                    "Select the column": (
                      <div className="text-lg">
                        <div className="relative mt-1">
                          <Listbox
                            value={selectedColumn}
                            onChange={setSelectedColumn}
                          >
                            <Listbox.Label className="text-lg">
                              Column
                            </Listbox.Label>
                            {/* <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"> */}
                            <Listbox.Button className="relative w-full cursor-default rounded bg-white/10 p-1 py-2 pl-3 pr-10 text-white">
                              <span className="block text-lg">
                                <>{selectedColumn}</>
                              </span>
                              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon
                                  className="h-5 w-5 text-gray-400"
                                  aria-hidden="true"
                                />
                              </span>
                            </Listbox.Button>
                            <Transition
                              as={Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {headers?.map((header) => (
                                  <Listbox.Option
                                    key={header.id}
                                    value={header.name}
                                    disabled={header.unavailable}
                                    className={({ active }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active
                                          ? "bg-amber-100 text-amber-900"
                                          : "text-gray-900"
                                      }`
                                    }
                                  >
                                    {/* @ts-ignore:next-line */}
                                    {({ selectedColumn }) => (
                                      <>
                                        <span
                                          className={`block truncate ${
                                            selectedColumn
                                              ? "font-medium"
                                              : "font-normal"
                                          }`}
                                        >
                                          <h3>{header.name}</h3>
                                          <p>Preview: {header.preview}</p>
                                        </span>
                                        {selectedColumn ? (
                                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                            <CheckIcon
                                              className="h-5 w-5"
                                              aria-hidden="true"
                                            />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </Transition>
                          </Listbox>
                        </div>
                        <button
                          onClick={columnSelected}
                          className="dark:focus my-1 w-full rounded-lg bg-white/10  px-5 py-2.5 text-center text-sm  text-white  dark:bg-[hsl(280,100%,70%)]  sm:w-auto"
                        >
                          Next
                        </button>
                      </div>
                    ),
                    "Download results": <div className="text-lg"></div>,
                    Processing: (
                      <div className="text-lg">{proccessingCount}</div>
                    ),
                  }[uploadState]
                }
              </div>
            </div>
            {/* <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20">
              <h3 className="text-2xl font-bold">Setup</h3>
              <div className="text-lg">
                <Formik
                  initialValues={{
                    username: "",
                    password: "",
                  }}
                  onSubmit={handleSubmit}
                >
                  <Form>
                    <label className="text-lg" htmlFor="username">
                      Username
                    </label>
                    <Field
                      className="w-full rounded bg-white/10 p-1 text-white"
                      id="username"
                      name="username"
                    />

                    <label className="text-lg" htmlFor="password">
                      Password
                    </label>
                    <Field
                      className="w-full rounded bg-white/10 p-1 text-white"
                      id="password"
                      name="password"
                      type="password"
                    />
                    <button
                      className="dark:focus my-1 w-full rounded-lg bg-white/10  px-5 py-2.5 text-center text-sm  text-white  dark:bg-[hsl(280,100%,70%)]  sm:w-auto"
                      type="submit"
                    >
                      Update
                    </button>
                    {localStorage.getItem("secret") ? (
                      <button
                        className="dark:focus my-1 w-full rounded-lg bg-white/10  px-5 py-2.5 text-center text-sm  text-white  dark:bg-[hsl(280,100%,70%)]  sm:w-auto"
                        type="submit"
                      >
                        Update
                      </button>
                    ) : (
                      <button
                        className="dark:focus my-1 w-full rounded-lg bg-white/10  px-5 py-2.5 text-center text-sm  text-white  dark:bg-[hsl(280,100%,70%)]  sm:w-auto"
                        type="submit"
                      >
                        Save
                      </button>
                    )}
                  </Form>
                </Formik>
              </div>
            </div> */}
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
