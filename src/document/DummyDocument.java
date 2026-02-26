package document;

import content.Content;
import content.StringContent;
import content.visitor.ToStringVisitor;
import node.DocumentNode;
import node.visitor.ContentListVisitor;
import node.Node;

public class DummyDocument extends Document{

	@Override
	public void draw() {
		topNode().accept(ContentListVisitor.get())
		.stream()
		.map(i -> i.accept(ToStringVisitor.get()))
		.forEach(i -> System.out.println(i));
	}
	
	@Override 
	public void write(String s) {
		StringContent.builder contentBuilder = StringContent.builder.get();
		DocumentNode.builder nodeBuilder = DocumentNode.builder.get();
		
		Content<String> newContent = contentBuilder
				.withAuthor(topNode().content().author())
				.withContent(s)
				.build();
		
		Node newNode = nodeBuilder
				.withContent(newContent)
				.withParent(getCurrentNode())
				.build();
		
		setCurrentNode(newNode);
	}

	
	public static Document newFromContent(Content<String> c) {
		Document newDocument = new DummyDocument();
		
		Node newNode = DocumentNode.builder.get().withContent(c).build();
		
		newDocument.setTopNode(newNode);
		
		return newDocument;
		
	}

}
