// package: kubemail
// file: proto/service.proto

import * as jspb from "google-protobuf";

export class GetSummaryRequest extends jspb.Message {
  getNamespace(): string;
  setNamespace(value: string): void;

  getFromTimestamp(): number;
  setFromTimestamp(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetSummaryRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetSummaryRequest): GetSummaryRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetSummaryRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetSummaryRequest;
  static deserializeBinaryFromReader(message: GetSummaryRequest, reader: jspb.BinaryReader): GetSummaryRequest;
}

export namespace GetSummaryRequest {
  export type AsObject = {
    namespace: string,
    fromTimestamp: number,
  }
}

export class Summary extends jspb.Message {
  clearItemList(): void;
  getItemList(): Array<Summary.Item>;
  setItemList(value: Array<Summary.Item>): void;
  addItem(value?: Summary.Item, index?: number): Summary.Item;

  getRecipientMap(): jspb.Map<string, number>;
  clearRecipientMap(): void;
  getSenderMap(): jspb.Map<string, number>;
  clearSenderMap(): void;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Summary.AsObject;
  static toObject(includeInstance: boolean, msg: Summary): Summary.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Summary, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Summary;
  static deserializeBinaryFromReader(message: Summary, reader: jspb.BinaryReader): Summary;
}

export namespace Summary {
  export type AsObject = {
    itemList: Array<Summary.Item.AsObject>,
    recipientMap: Array<[string, number]>,
    senderMap: Array<[string, number]>,
  }

  export class Item extends jspb.Message {
    getTimestamp(): number;
    setTimestamp(value: number): void;

    getMessageCount(): number;
    setMessageCount(value: number): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Item.AsObject;
    static toObject(includeInstance: boolean, msg: Item): Item.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Item, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Item;
    static deserializeBinaryFromReader(message: Item, reader: jspb.BinaryReader): Item;
  }

  export namespace Item {
    export type AsObject = {
      timestamp: number,
      messageCount: number,
    }
  }
}

export class ListCaughtEmailsRequest extends jspb.Message {
  getNamespace(): string;
  setNamespace(value: string): void;

  getLimit(): number;
  setLimit(value: number): void;

  getOffset(): number;
  setOffset(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListCaughtEmailsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListCaughtEmailsRequest): ListCaughtEmailsRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ListCaughtEmailsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListCaughtEmailsRequest;
  static deserializeBinaryFromReader(message: ListCaughtEmailsRequest, reader: jspb.BinaryReader): ListCaughtEmailsRequest;
}

export namespace ListCaughtEmailsRequest {
  export type AsObject = {
    namespace: string,
    limit: number,
    offset: number,
  }
}

export class GetCaughtEmailRequest extends jspb.Message {
  getNamespace(): string;
  setNamespace(value: string): void;

  getId(): string;
  setId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetCaughtEmailRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetCaughtEmailRequest): GetCaughtEmailRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetCaughtEmailRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetCaughtEmailRequest;
  static deserializeBinaryFromReader(message: GetCaughtEmailRequest, reader: jspb.BinaryReader): GetCaughtEmailRequest;
}

export namespace GetCaughtEmailRequest {
  export type AsObject = {
    namespace: string,
    id: string,
  }
}

export class WatchCaughtEmailsRequest extends jspb.Message {
  getNamespace(): string;
  setNamespace(value: string): void;

  getOnlyNew(): boolean;
  setOnlyNew(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WatchCaughtEmailsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: WatchCaughtEmailsRequest): WatchCaughtEmailsRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WatchCaughtEmailsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WatchCaughtEmailsRequest;
  static deserializeBinaryFromReader(message: WatchCaughtEmailsRequest, reader: jspb.BinaryReader): WatchCaughtEmailsRequest;
}

export namespace WatchCaughtEmailsRequest {
  export type AsObject = {
    namespace: string,
    onlyNew: boolean,
  }
}

export class ListCaughtEmailsResponse extends jspb.Message {
  getLimit(): number;
  setLimit(value: number): void;

  getOffset(): number;
  setOffset(value: number): void;

  getTotalCount(): number;
  setTotalCount(value: number): void;

  clearEmailList(): void;
  getEmailList(): Array<Email>;
  setEmailList(value: Array<Email>): void;
  addEmail(value?: Email, index?: number): Email;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListCaughtEmailsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListCaughtEmailsResponse): ListCaughtEmailsResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ListCaughtEmailsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListCaughtEmailsResponse;
  static deserializeBinaryFromReader(message: ListCaughtEmailsResponse, reader: jspb.BinaryReader): ListCaughtEmailsResponse;
}

export namespace ListCaughtEmailsResponse {
  export type AsObject = {
    limit: number,
    offset: number,
    totalCount: number,
    emailList: Array<Email.AsObject>,
  }
}

export class Email extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  hasSource(): boolean;
  clearSource(): void;
  getSource(): Email.Source | undefined;
  setSource(value?: Email.Source): void;

  hasEnvelope(): boolean;
  clearEnvelope(): void;
  getEnvelope(): Email.EmailEnvelope | undefined;
  setEnvelope(value?: Email.EmailEnvelope): void;

  getDate(): number;
  setDate(value: number): void;

  hasMessage(): boolean;
  clearMessage(): void;
  getMessage(): Email.EmailMessage | undefined;
  setMessage(value?: Email.EmailMessage): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Email.AsObject;
  static toObject(includeInstance: boolean, msg: Email): Email.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Email, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Email;
  static deserializeBinaryFromReader(message: Email, reader: jspb.BinaryReader): Email;
}

export namespace Email {
  export type AsObject = {
    id: string,
    source?: Email.Source.AsObject,
    envelope?: Email.EmailEnvelope.AsObject,
    date: number,
    message?: Email.EmailMessage.AsObject,
  }

  export class Source extends jspb.Message {
    getPodName(): string;
    setPodName(value: string): void;

    getNamespace(): string;
    setNamespace(value: string): void;

    getLabelMap(): jspb.Map<string, string>;
    clearLabelMap(): void;
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Source.AsObject;
    static toObject(includeInstance: boolean, msg: Source): Source.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Source, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Source;
    static deserializeBinaryFromReader(message: Source, reader: jspb.BinaryReader): Source;
  }

  export namespace Source {
    export type AsObject = {
      podName: string,
      namespace: string,
      labelMap: Array<[string, string]>,
    }
  }

  export class EmailEnvelope extends jspb.Message {
    getMailFrom(): string;
    setMailFrom(value: string): void;

    clearRcptToList(): void;
    getRcptToList(): Array<string>;
    setRcptToList(value: Array<string>): void;
    addRcptTo(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EmailEnvelope.AsObject;
    static toObject(includeInstance: boolean, msg: EmailEnvelope): EmailEnvelope.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EmailEnvelope, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EmailEnvelope;
    static deserializeBinaryFromReader(message: EmailEnvelope, reader: jspb.BinaryReader): EmailEnvelope;
  }

  export namespace EmailEnvelope {
    export type AsObject = {
      mailFrom: string,
      rcptToList: Array<string>,
    }
  }

  export class EmailMessage extends jspb.Message {
    getSubject(): string;
    setSubject(value: string): void;

    hasBody(): boolean;
    clearBody(): void;
    getBody(): Email.EmailMessage.Content | undefined;
    setBody(value?: Email.EmailMessage.Content): void;

    clearToList(): void;
    getToList(): Array<string>;
    setToList(value: Array<string>): void;
    addTo(value: string, index?: number): string;

    clearFromList(): void;
    getFromList(): Array<string>;
    setFromList(value: Array<string>): void;
    addFrom(value: string, index?: number): string;

    clearCcList(): void;
    getCcList(): Array<string>;
    setCcList(value: Array<string>): void;
    addCc(value: string, index?: number): string;

    clearBccList(): void;
    getBccList(): Array<string>;
    setBccList(value: Array<string>): void;
    addBcc(value: string, index?: number): string;

    clearHeaderList(): void;
    getHeaderList(): Array<Email.EmailMessage.Header>;
    setHeaderList(value: Array<Email.EmailMessage.Header>): void;
    addHeader(value?: Email.EmailMessage.Header, index?: number): Email.EmailMessage.Header;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EmailMessage.AsObject;
    static toObject(includeInstance: boolean, msg: EmailMessage): EmailMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EmailMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EmailMessage;
    static deserializeBinaryFromReader(message: EmailMessage, reader: jspb.BinaryReader): EmailMessage;
  }

  export namespace EmailMessage {
    export type AsObject = {
      subject: string,
      body?: Email.EmailMessage.Content.AsObject,
      toList: Array<string>,
      fromList: Array<string>,
      ccList: Array<string>,
      bccList: Array<string>,
      headerList: Array<Email.EmailMessage.Header.AsObject>,
    }

    export class Content extends jspb.Message {
      getText(): string;
      setText(value: string): void;

      getHtml(): string;
      setHtml(value: string): void;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): Content.AsObject;
      static toObject(includeInstance: boolean, msg: Content): Content.AsObject;
      static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
      static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
      static serializeBinaryToWriter(message: Content, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): Content;
      static deserializeBinaryFromReader(message: Content, reader: jspb.BinaryReader): Content;
    }

    export namespace Content {
      export type AsObject = {
        text: string,
        html: string,
      }
    }

    export class Header extends jspb.Message {
      getName(): string;
      setName(value: string): void;

      getValue(): string;
      setValue(value: string): void;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): Header.AsObject;
      static toObject(includeInstance: boolean, msg: Header): Header.AsObject;
      static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
      static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
      static serializeBinaryToWriter(message: Header, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): Header;
      static deserializeBinaryFromReader(message: Header, reader: jspb.BinaryReader): Header;
    }

    export namespace Header {
      export type AsObject = {
        name: string,
        value: string,
      }
    }
  }
}

