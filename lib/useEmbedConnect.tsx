import { useCallback } from "react";

const DEFAULT_HOST = "https://api.useembed.com";
const DEFAULT_WEBSOCKET_PATH = "/";

export type UseEmbedConnectProps = {
  flow?: "popup" | "redirect";
  redirectUrl?: string;
  host?: string;
};

enum MessageType {
  ConnectionAck = "connection_ack",
  Error = "error",
  Success = "success",
}

export const useEmbedConnect = (props: UseEmbedConnectProps | undefined) => {
  const appendParamsToUrl = (url: string, params: Record<string, string>) => {
    const baseUrl = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      baseUrl.searchParams.set(key, value);
    });

    return baseUrl.toString();
  };

  const getPopupLayout = (width: number, height: number) => {
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const left = screenWidth / 2 - width / 2;
    const top = screenHeight / 2 - height / 2;
    const computedWidth = Math.min(width, screenWidth);
    const computedHeight = Math.min(height, screenHeight);

    return {
      left: Math.max(left, 0),
      top: Math.max(top, 0),
      computedWidth,
      computedHeight,
    };
  };

  const featuresToString = (features: Record<string, any>) => {
    return Object.entries(features)
      .map(([key, value]) => `${key}=${value}`)
      .join(",");
  };

  const openPopup = useCallback(
    (url: string) => {
      const layout = getPopupLayout(500, 600);
      const featuresString = featuresToString({
        width: layout.computedWidth,
        height: layout.computedHeight,
        top: layout.top,
        left: layout.left,
        scrollbars: "yes",
        resizable: "yes",
        status: "no",
        toolbar: "no",
        location: "no",
        copyhistory: "no",
        menubar: "no",
        directories: "no",
      });

      window.open(url, "_blank", featuresString);
    },
    [getPopupLayout, featuresToString]
  );

  const prefersDarkMode = () => {
    const pefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return pefersDark.toString();
  };

  const handleMessage = useCallback(
    (
      message: MessageEvent,
      websocket: WebSocket,
      url: string,
      onSuccess: (connectionId: string) => any,
      onError: (error: Error) => any
    ) => {
      const data = JSON.parse(message.data);
      switch (data.message_type) {
        case MessageType.ConnectionAck:
          const params = {
            flow: "popup",
            ws_client_id: data.ws_client_id,
            prefers_dark_mode: prefersDarkMode(),
          };

          const popupUrl = appendParamsToUrl(url, params);
          openPopup(popupUrl);
          return;

        case MessageType.Error:
          const error = new Error(data.error);
          onError(error);
          websocket.close();
          return;

        case MessageType.Success:
          onSuccess(data.connection_id);
          websocket.close();
          return;

        default:
          return;
      }
    },
    [appendParamsToUrl, prefersDarkMode, openPopup]
  );

  const connect = useCallback(
    (sessionToken: string) => {
      if (!sessionToken) {
        throw new Error("Session token is required");
      }

      return new Promise<{ connectionId: string }>((resolve, reject) => {
        const hostUrl = props?.host || DEFAULT_HOST;
        const wsPath = DEFAULT_WEBSOCKET_PATH;
        const hostBaseUrl =
          hostUrl.slice(-1) === "/" ? hostUrl.slice(0, -1) : hostUrl;
        let websocketBaseUrl: string;

        try {
          const baseUrl = new URL(hostBaseUrl);
          const websocketUrl = new URL(wsPath, baseUrl);
          websocketBaseUrl = websocketUrl
            .toString()
            .replace("https://", "wss://")
            .replace("http://", "ws://");
        } catch (err) {
          throw new Error("Invalid host URL or websocket path");
        }

        const onSuccess = (connectionId: string) => {
          return resolve({ connectionId });
        };

        const onError = (error: Error) => {
          return reject(error);
        };

        const url = `${hostBaseUrl}/token/${sessionToken}`;
        if (props?.flow === "popup" || (!props?.flow && !props?.redirectUrl)) {
          const websocket = new WebSocket(websocketBaseUrl);
          websocket.onmessage = (message: MessageEvent) => {
            handleMessage(message, websocket, url, onSuccess, onError);
          };
        }

        if (
          props?.flow === "redirect" ||
          (!props?.flow && props?.redirectUrl)
        ) {
          const params: { flow: string; redirect_url?: string } = {
            flow: "redirect",
          };

          if (props?.redirectUrl) {
            params.redirect_url = props.redirectUrl;
          }

          window.location.href = appendParamsToUrl(url, params);
        }

        if (
          props?.flow &&
          props.flow !== "popup" &&
          props.flow !== "redirect"
        ) {
          const err = new Error("Invalid flow");
          onError(err);
        }
      });
    },
    [props, handleMessage, appendParamsToUrl]
  );

  return { connect };
};
