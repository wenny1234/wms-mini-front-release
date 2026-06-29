import { message as antMessage } from 'antd';

type MessageType = 'success' | 'error' | 'warning' | 'info' | 'loading';

function show(type: MessageType, content: string, duration?: number) {
  antMessage.destroy();
  return antMessage[type](content, duration);
}

export const message = {
  success: (content: string, duration?: number) => show('success', content, duration),
  error: (content: string, duration?: number) => show('error', content, duration),
  warning: (content: string, duration?: number) => show('warning', content, duration),
  info: (content: string, duration?: number) => show('info', content, duration),
  loading: (content: string, duration?: number) => show('loading', content, duration),
  destroy: () => antMessage.destroy(),
};
