'use client';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building, AreaChart, DollarSign, University, Hospital, Car, Route, TrendingUp, Lightbulb, UserCircle, Map } from "lucide-react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statsData = {
  general: {
    population: "17 Million (Estimation 2024)",
    area: "9,965 km²",
    density: "1,706 hab./km²",
    governor: "Gentiny Ngobila Mbaka",
    governorImage: "data:image/jpeg;base64,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",
  },
  communes: [
    "Bandalungwa", "Barumbu", "Bumbu", "Gombe", "Kalamu", "Kasa-Vubu", "Kimbanseke", "Kinshasa", "Kintambo", "Kisenso", "Lemba", "Limete", "Lingwala", "Makala", "Maluku", "Masina", "Matete", "Mont-Ngafula", "N'djili", "N'sele", "Ngaba", "Ngaliema", "Ngiri-Ngiri", "Selembao"
  ],
  economy: {
    gdp: "Approx. 55 Milliards USD (Ville-province)",
    keySectors: ["Services", "Commerce", "Construction", "Industrie légère", "Transport"],
  },
  projections: {
    economicGrowth: "+4.5% (prévision 2026)",
    focusAreas: ["Infrastructures numériques", "Transport urbain", "Énergies renouvelables"],
  },
  infrastructure: {
    universities: "Plus de 50 institutions",
    hospitals: "Plus de 300 centres de santé et hôpitaux",
  },
  transport: {
    mainRoads: "Blvd. Lumumba, Blvd. du 30 Juin, Av. Kasa-Vubu",
    vehicles: "Plus de 1.2 million de véhicules (estimation)",
  }
};

const populationChartData = [
  { year: "2020", "Population (Millions)": 14.3 },
  { year: "2024", "Population (Millions)": 17.0 },
  { year: "2026", "Population (Millions)": 18.5 },
  { year: "2030", "Population (Millions)": 21.7 },
];

const chartConfig = {
  population: {
    label: "Population (Millions)",
    color: "hsl(var(--primary))",
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
        duration: 0.5
    }
  },
};

export default function KinshasaStats() {
  return (
    <div className="w-full h-full overflow-y-auto pr-2">
      <Tabs defaultValue="apercu" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="apercu">Aperçu</TabsTrigger>
          <TabsTrigger value="communes">Communes</TabsTrigger>
          <TabsTrigger value="transport">Transport</TabsTrigger>
          <TabsTrigger value="infrastructures">Infrastructures</TabsTrigger>
          <TabsTrigger value="economie-avenir">Économie & Avenir</TabsTrigger>
        </TabsList>
        
        <motion.div
          key="apercu"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <TabsContent value="apercu" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="text-primary" />
                    Démographie
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <p className="font-semibold">Population</p>
                    <p className="text-muted-foreground">{statsData.general.population}</p>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <p className="font-semibold">Superficie</p>
                    <p className="text-muted-foreground">{statsData.general.area}</p>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <p className="font-semibold">Densité</p>
                    <p className="text-muted-foreground">{statsData.general.density}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCircle className="text-primary" />
                            Gouverneur de la ville
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <Image src={statsData.general.governorImage} alt="Gouverneur de Kinshasa" width={80} height={80} className="rounded-full border-2 border-primary" data-ai-hint="official portrait" />
                        <div>
                            <p className="font-bold text-lg">{statsData.general.governor}</p>
                            <p className="text-muted-foreground">Gouverneur de la ville-province de Kinshasa</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
          </TabsContent>
        </motion.div>

        <motion.div
          key="communes"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <TabsContent value="communes">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="text-primary" />
                    Les 24 Communes
                  </CardTitle>
                  <CardDescription>Kinshasa est divisée en 24 communes administratives.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {statsData.communes.map(commune => (
                      <div key={commune} className="p-3 rounded-lg border bg-muted/30 text-sm font-medium hover:bg-accent transition-colors cursor-default">
                        {commune}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </motion.div>


        <motion.div
          key="transport"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <TabsContent value="transport">
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="text-primary" />
                    Transport
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <p className="font-semibold">Véhicules (est.)</p>
                    <p className="text-muted-foreground">{statsData.transport.vehicles}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                      <p className="font-semibold mb-2">Artères Principales</p>
                      <div className="flex flex-wrap gap-2">
                          {statsData.transport.mainRoads.split(', ').map(road => (
                              <div key={road} className="text-xs flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-full"><Route className="h-3 w-3" />{road}</div>
                          ))}
                      </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </motion.div>

        <motion.div
          key="infrastructures"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <TabsContent value="infrastructures">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="text-primary" />
                    Infrastructures Sociales
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                      <University className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-xl">{statsData.infrastructure.universities}</p>
                      <p className="text-muted-foreground">Universités & Instituts Supérieurs</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="bg-success/10 text-success p-3 rounded-full">
                      <Hospital className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-xl">{statsData.infrastructure.hospitals}</p>
                      <p className="text-muted-foreground">Hôpitaux & Centres de Santé</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </motion.div>

        <motion.div
          key="economie-avenir"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <TabsContent value="economie-avenir">
              <motion.div variants={itemVariants}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="text-success" />
                      Économie
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg border bg-muted/30">
                        <p className="font-semibold mb-1">PIB (estimation)</p>
                        <p className="text-2xl font-bold text-success">{statsData.economy.gdp}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/30">
                        <p className="font-semibold mb-2">Secteurs Clés</p>
                        <div className="flex flex-wrap gap-2">
                            {statsData.economy.keySectors.map(sector => (
                                <div key={sector} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{sector}</div>
                            ))}
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={itemVariants} className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AreaChart className="text-primary" />
                            Projections & Avenir
                        </CardTitle>
                        <CardDescription>Croissance démographique et axes de développement futurs.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid lg:grid-cols-2 gap-6 items-center">
                        <div className="h-[250px] w-full">
                          <p className="text-sm font-semibold text-foreground mb-2">Croissance de la Population</p>
                          <ChartContainer config={chartConfig} className="w-full h-full">
                              <BarChart accessibilityLayer data={populationChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid vertical={false} />
                                  <XAxis dataKey="year" tickLine={false} tickMargin={10} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                                  <YAxis unit="M" tickLine={false} tickMargin={10} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                                  <ChartTooltip 
                                      cursor={false} 
                                      content={<ChartTooltipContent indicator="dot" />}
                                  />
                                  <Bar dataKey="Population (Millions)" name="Population" fill="hsl(var(--primary))" radius={4} />
                              </BarChart>
                          </ChartContainer>
                        </div>
                         <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 rounded-lg border">
                              <div className="bg-primary/10 text-primary p-3 rounded-full">
                                <TrendingUp className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="font-bold text-xl">{statsData.projections.economicGrowth}</p>
                                <p className="text-muted-foreground">Croissance économique attendue</p>
                              </div>
                            </div>
                            <div className="p-4 rounded-lg border">
                                <p className="font-semibold mb-3 flex items-center gap-2"><Lightbulb className="text-primary h-5 w-5"/> Axes de Développement</p>
                                <div className="flex flex-wrap gap-2">
                                    {statsData.projections.focusAreas.map(area => (
                                        <div key={area} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{area}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
              </motion.div>
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
}
