import { Spin, Card, Row, Col, Divider, Tag, Typography } from "antd";
import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { ExchangeRecord } from "@/model/ExchangeRecord";
import { IconRefresh, IconNotes } from "@tabler/icons-react";

const { Text, Title } = Typography;

interface OrderExchangeHistoryProps {
  orderId: string;
}

export const OrderExchangeHistory: React.FC<OrderExchangeHistoryProps> = ({
  orderId,
}) => {
  const [exchanges, setExchanges] = useState<ExchangeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExchanges = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/erp/orders/${orderId}/exchanges`);
      setExchanges(response.data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  if (loading) {
    return (
      <Card className="shadow-sm border-gray-200">
        <div className="flex justify-center py-12">
          <Spin />
        </div>
      </Card>
    );
  }

  if (exchanges.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-1">
        <IconRefresh size={24} className="text-gray-400" />
        <Title level={4} style={{ margin: 0, letterSpacing: "-0.02em" }}>
          Exchange History ({exchanges.length})
        </Title>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {exchanges.map((exchange) => (
          <Card
            key={exchange.id}
            className="shadow-sm border-gray-200 overflow-hidden"
            bodyStyle={{ padding: 0 }}
          >
            {/* Header */}
            <div className="bg-gray-50/80 px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-gray-200">
              <div className="space-y-1">
                <Text
                  type="secondary"
                  className="text-[10px] uppercase font-bold tracking-widest block"
                >
                  Exchange Identifier
                </Text>
                <Text className="font-mono font-bold text-sm tracking-tighter">
                  {exchange.id}
                </Text>
              </div>

              <div className="space-y-1">
                <Text
                  type="secondary"
                  className="text-[10px] uppercase font-bold tracking-widest block"
                >
                  Transaction Date
                </Text>
                <Text className="font-bold text-sm">
                  {exchange.createdAt}
                </Text>
              </div>

              <div className="text-right">
                <Text
                  type="secondary"
                  className="text-[10px] uppercase font-bold tracking-widest block"
                >
                  Net Adjustment
                </Text>
                <Title
                  level={4}
                  style={{ margin: 0 }}
                  className={
                    exchange.priceDifference > 0
                      ? "text-red-600"
                      : "text-gray-900"
                  }
                >
                  {exchange.priceDifference > 0
                    ? `+ Rs. ${exchange.priceDifference.toLocaleString()}`
                    : exchange.priceDifference < 0
                      ? `- Rs. ${Math.abs(exchange.priceDifference).toLocaleString()}`
                      : "Rs. 0.00"}
                </Title>
                {exchange.paymentMethod && (
                  <Tag
                    color="green"
                    className="mt-1 mr-0 font-bold border-none uppercase text-[10px]"
                  >
                    Paid via {exchange.paymentMethod}
                  </Tag>
                )}
              </div>
            </div>

            {/* Content */}
            <Row>
              <Col
                xs={24}
                md={12}
                className="p-6 border-b md:border-b-0 md:border-r border-gray-100"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <Text
                    type="secondary"
                    className="text-xs font-bold uppercase tracking-wider"
                  >
                    Returned Items
                  </Text>
                </div>

                <div className="space-y-4">
                  {exchange.returnedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start gap-4"
                    >
                      <div className="space-y-0.5">
                        <Text className="font-bold text-sm block leading-tight">
                          {item.name}
                        </Text>
                        <Text
                          type="secondary"
                          className="text-[11px] font-medium italic"
                        >
                          {item.size}{" "}
                          {item.variantName ? `• ${item.variantName}` : ""}
                        </Text>
                      </div>
                      <div className="text-right">
                        <Text className="font-bold text-sm block">
                          x{item.quantity}
                        </Text>
                        <Text type="secondary" className="text-[11px] block">
                          Rs. {item.price.toLocaleString()}
                        </Text>
                        {item.discount > 0 && (
                          <Text className="text-[10px] text-red-500 font-bold block">
                            - Rs. {item.discount.toLocaleString()}
                          </Text>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Divider className="my-4" />
                <div className="flex justify-between text-xs font-bold">
                  <Text type="secondary" className="uppercase tracking-widest">
                    Total Credit
                  </Text>
                  <Text className="text-sm tracking-tight text-red-500">
                    Rs. {exchange.returnTotal.toLocaleString()}
                  </Text>
                </div>
              </Col>

              <Col xs={24} md={12} className="p-6 bg-green-50/10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <Text
                    type="secondary"
                    className="text-xs font-bold uppercase tracking-wider"
                  >
                    Replacements
                  </Text>
                </div>

                <div className="space-y-4">
                  {exchange.replacementItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start gap-4"
                    >
                      <div className="space-y-0.5">
                        <Text className="font-bold text-sm block leading-tight">
                          {item.name}
                        </Text>
                        <Text
                          type="secondary"
                          className="text-[11px] font-medium italic"
                        >
                          {item.size}{" "}
                          {item.variantName ? `• ${item.variantName}` : ""}
                        </Text>
                      </div>
                      <div className="text-right">
                        <Text className="font-bold text-sm block">
                          x{item.quantity}
                        </Text>
                        <Text type="secondary" className="text-[11px] block">
                          Rs. {item.price.toLocaleString()}
                        </Text>
                        {item.discount > 0 && (
                          <Text className="text-[10px] text-green-600 font-bold block">
                            - Rs. {item.discount.toLocaleString()}
                          </Text>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Divider className="my-4" />
                <div className="flex justify-between text-xs font-bold">
                  <Text type="secondary" className="uppercase tracking-widest">
                    Total Debit
                  </Text>
                  <Text className="text-sm tracking-tight text-green-600">
                    Rs. {exchange.replacementTotal.toLocaleString()}
                  </Text>
                </div>
              </Col>
            </Row>

            {/* Footer Notes */}
            {exchange.notes && (
              <div className="px-6 py-3 bg-yellow-50/40 border-t border-gray-100 flex items-start gap-2">
                <IconNotes size={14} className="text-yellow-600 mt-0.5" />
                <Text className="text-xs text-gray-500 italic">
                  <span className="font-bold text-gray-400 not-italic uppercase tracking-widest mr-2">
                    Notes:
                  </span>
                  {exchange.notes}
                </Text>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
