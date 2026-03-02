\"use client\";

import { Card, Typography, Row, Col, Statistic } from \"antd\";

const { Title, Text } = Typography;

export default function RevenueEstimatePage() {
  return (
    <div style={{ maxWidth: 1100, margin: \"0 auto\" }}>
      <Title level={3} style={{ marginBottom: 16 }}>
        收益估算
      </Title>
      <Text type=\"secondary\">
        当前为静态估算面板，后续可以接入真实订单与成本数据。
      </Text>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title=\"本月预计销售额 (CNY)\" value={0} precision={2} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title=\"本月预计毛利 (CNY)\" value={0} precision={2} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title=\"毛利率\" value={0} precision={2} suffix=\"%\" />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }}>
        <Title level={5}>说明</Title>
        <Text type=\"secondary\">
          后续可以按「SKU × 渠道」维度拆分：销售单价 × 预计销量 − 成本价 × 预计销量，自动汇总为店铺级收益估算。
        </Text>
      </Card>
    </div>
  );
}

