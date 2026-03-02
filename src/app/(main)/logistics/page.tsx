\"use client\";

import { Card, Typography, Row, Col, Tag } from \"antd\";

const { Title, Text } = Typography;

export default function LogisticsOverviewPage() {
  return (
    <div style={{ maxWidth: 1100, margin: \"0 auto\" }}>
      <Title level={3} style={{ marginBottom: 16 }}>
        物流总览
      </Title>
      <Text type=\"secondary\">
        后续可以接入各渠道发货数据，这里先提供一个基础概览框架。
      </Text>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Text type=\"secondary\">今日待发货订单</Text>
            <Title level={3} style={{ marginTop: 8 }}>
              0
            </Title>
            <Text type=\"secondary\">按渠道拆分、设置优先级等功能可后续补充。</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Text type=\"secondary\">在途包裹</Text>
            <Title level={3} style={{ marginTop: 8 }}>
              0
            </Title>
            <Text type=\"secondary\">可对接物流轨迹，区分异常/延误。</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Text type=\"secondary\">近7天签收率</Text>
            <Title level={3} style={{ marginTop: 8 }}>
              0%
            </Title>
            <Tag color=\"default\">基础占位</Tag>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

