import { ReactNode, useEffect } from "react";
import { Spin } from "antd";

type Props = {
  description?: string;
  children?: ReactNode;
  title?: string;
  loading?: boolean;
};

const PageContainer = ({ title, children, loading }: Props) => {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Spin size="large" />
      </div>
    );
  }

  return <div className="flex-1 flex flex-col">{children}</div>;
};

export default PageContainer;
