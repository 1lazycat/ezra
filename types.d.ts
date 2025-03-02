type FrameWindowAction = "CLOSE" | "MAXIMIZE" | "MINIMIZE";

type ExtractedFile = {
  id: string;
  title: string;
  size: number;
  contentType: string;
  content: string;
};

type AwsS3ZipExtracted = {
  zipFile: string;
  extractedFolder: string;
  extractedFiles: ExtractedFile[];
};

type EventMapping = {
  getZipFile: {
    payload: [batchId: string, fileName: string]; // Named tuple
    response: Promise<AwsS3ZipExtracted>;
  };
  changeView: {
    payload: View;
    response: void;
  };
  sendFrameAction: {
    payload: [action: FrameWindowAction];
    response: void;
  };
};

type UnsubscribeFunction = () => void;

type AppConfig = {
  s3: {
    config: {
      region: string;
      credentials: {
        accessKeyId: string;
        secretAccessKey: string;
      };
    };
    bucketName: string;
    folder?: string;
  };
  tools: {
    sevenZip: {
      path?: string;
    };
  };
};

interface Window {
  electron: {
    getZipFile: (
      ...args: EventMapping["getZipFile"]["payload"]
    ) => EventMapping["getZipFile"]["response"];
    subscribeChangeView: (
      callback: (view: View) => void
    ) => UnsubscribeFunction;
    sendFrameAction: (
      ...args: EventMapping["sendFrameAction"]["payload"]
    ) => EventMapping["sendFrameAction"]["response"];
  };
}
